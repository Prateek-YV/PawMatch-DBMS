USE pawmatchdb;

ALTER TABLE foster_profile ADD CONSTRAINT chk_foster_availability CHECK (availability_status IN ('available','unavailable','full'));
ALTER TABLE adopter_profile ADD CONSTRAINT chk_adopter_housing CHECK (housing_type IN ('house','apartment','farm','other'));
ALTER TABLE medical_record ADD CONSTRAINT chk_medical_vaccination CHECK (vaccination_status IN ('up_to_date','pending','overdue'));
ALTER TABLE pet_match ADD CONSTRAINT uq_pet_match_user_pet UNIQUE (user_id, pet_id);
ALTER TABLE pet_image ADD CONSTRAINT uq_pet_image_url UNIQUE (image_url);

CREATE INDEX idx_pet_status_species ON pet (adoption_status, species);
CREATE INDEX idx_pet_intake_date ON pet (intake_date);
CREATE FULLTEXT INDEX ft_pet_temperament ON pet (temperament, breed);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_application_status_date ON adoption_application (status, application_date);
CREATE INDEX idx_foster_status_end ON foster_assignment (status, end_date);
CREATE INDEX idx_medical_checkup ON medical_record (pet_id, checkup_date);
CREATE INDEX idx_pet_match_user_score ON pet_match (user_id, match_score DESC);

CREATE OR REPLACE VIEW v_available_pets AS SELECT p.pet_id, p.name, p.species, p.breed, p.age, p.gender, p.temperament, s.shelter_name, s.city, (SELECT i.image_url FROM pet_image i WHERE i.pet_id = p.pet_id ORDER BY i.image_no LIMIT 1) AS primary_image FROM pet p JOIN shelter s ON s.shelter_id = p.shelter_id WHERE p.adoption_status = 'available';

CREATE OR REPLACE VIEW v_application_details AS SELECT a.application_id, a.application_date, a.status, a.decision_date, CONCAT(u.first_name, ' ', u.last_name) AS applicant, p.pet_id, p.name AS pet_name, p.species, s.shelter_name, CONCAT(r.first_name, ' ', r.last_name) AS reviewer FROM adoption_application a JOIN users u ON u.user_id = a.user_id JOIN pet p ON p.pet_id = a.pet_id JOIN shelter s ON s.shelter_id = p.shelter_id LEFT JOIN users r ON r.user_id = a.reviewed_by;

CREATE OR REPLACE VIEW v_foster_load AS SELECT fp.user_id, CONCAT(u.first_name, ' ', u.last_name) AS foster_name, fp.max_capacity, COUNT(fa.foster_id) AS active_fosters, fp.max_capacity - COUNT(fa.foster_id) AS spare_capacity, fp.availability_status FROM foster_profile fp JOIN users u ON u.user_id = fp.user_id LEFT JOIN foster_assignment fa ON fa.user_id = fp.user_id AND fa.status = 'active' GROUP BY fp.user_id, u.first_name, u.last_name, fp.max_capacity, fp.availability_status;

CREATE OR REPLACE VIEW v_pet_health AS SELECT p.pet_id, p.name, p.species, p.adoption_status, m.checkup_date AS last_checkup, m.vaccination_status, m.diagnosis FROM pet p LEFT JOIN medical_record m ON m.pet_id = p.pet_id AND m.record_no = (SELECT MAX(m2.record_no) FROM medical_record m2 WHERE m2.pet_id = p.pet_id);

CREATE OR REPLACE VIEW v_shelter_summary AS SELECT s.shelter_id, s.shelter_name, s.city, COUNT(p.pet_id) AS total_pets, COALESCE(SUM(p.adoption_status = 'available'), 0) AS available, COALESCE(SUM(p.adoption_status = 'pending'), 0) AS pending, COALESCE(SUM(p.adoption_status = 'fostered'), 0) AS fostered, COALESCE(SUM(p.adoption_status = 'adopted'), 0) AS adopted FROM shelter s LEFT JOIN pet p ON p.shelter_id = s.shelter_id GROUP BY s.shelter_id, s.shelter_name, s.city;

CREATE OR REPLACE VIEW v_user_recommendations AS SELECT m.user_id, CONCAT(u.first_name, ' ', u.last_name) AS adopter, m.pet_id, p.name AS pet_name, p.species, p.breed, s.shelter_name, m.match_score, m.generated_date FROM pet_match m JOIN users u ON u.user_id = m.user_id JOIN pet p ON p.pet_id = m.pet_id JOIN shelter s ON s.shelter_id = p.shelter_id WHERE p.adoption_status = 'available';

DELIMITER $$

CREATE TRIGGER trg_application_before_insert BEFORE INSERT ON adoption_application FOR EACH ROW
BEGIN
    DECLARE v_role VARCHAR(20);
    DECLARE v_pet_status VARCHAR(20);
    DECLARE v_duplicate INT DEFAULT 0;
    SELECT role INTO v_role FROM users WHERE user_id = NEW.user_id;
    IF v_role IS NULL OR v_role <> 'adopter' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only users with role adopter can submit adoption applications';
    END IF;
    SELECT adoption_status INTO v_pet_status FROM pet WHERE pet_id = NEW.pet_id;
    IF v_pet_status = 'adopted' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This pet has already been adopted';
    END IF;
    SELECT COUNT(*) INTO v_duplicate FROM adoption_application WHERE user_id = NEW.user_id AND pet_id = NEW.pet_id AND status = 'pending';
    IF v_duplicate > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A pending application for this pet by this user already exists';
    END IF;
END$$

CREATE TRIGGER trg_application_after_insert AFTER INSERT ON adoption_application FOR EACH ROW
BEGIN
    IF NEW.status = 'pending' THEN
        UPDATE pet SET adoption_status = 'pending' WHERE pet_id = NEW.pet_id AND adoption_status = 'available';
    END IF;
END$$

CREATE TRIGGER trg_application_before_update BEFORE UPDATE ON adoption_application FOR EACH ROW
BEGIN
    DECLARE v_role VARCHAR(20);
    DECLARE v_reviewer_shelter VARCHAR(10);
    DECLARE v_pet_shelter VARCHAR(10);
    IF OLD.status <> 'pending' AND NEW.status <> OLD.status THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A finalised application cannot change status';
    END IF;
    IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
        IF NEW.reviewed_by IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A reviewer is required to approve or reject an application';
        END IF;
        SELECT role, shelter_id INTO v_role, v_reviewer_shelter FROM users WHERE user_id = NEW.reviewed_by;
        SELECT shelter_id INTO v_pet_shelter FROM pet WHERE pet_id = NEW.pet_id;
        IF v_role IS NULL OR v_role NOT IN ('admin', 'shelter_staff') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reviewer must be an admin or shelter staff member';
        END IF;
        IF v_role = 'shelter_staff' AND v_reviewer_shelter <> v_pet_shelter THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Shelter staff can only review applications for pets of their own shelter';
        END IF;
        IF NEW.decision_date IS NULL THEN
            SET NEW.decision_date = CURDATE();
        END IF;
    END IF;
    IF NEW.status = 'withdrawn' AND OLD.status = 'pending' AND NEW.decision_date IS NULL THEN
        SET NEW.decision_date = CURDATE();
    END IF;
END$$

CREATE TRIGGER trg_application_after_update AFTER UPDATE ON adoption_application FOR EACH ROW
BEGIN
    DECLARE v_other_pending INT DEFAULT 0;
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
        UPDATE pet SET adoption_status = 'adopted' WHERE pet_id = NEW.pet_id;
    ELSEIF NEW.status IN ('rejected', 'withdrawn') AND OLD.status = 'pending' THEN
        SELECT COUNT(*) INTO v_other_pending FROM adoption_application WHERE pet_id = NEW.pet_id AND status = 'pending' AND application_id <> NEW.application_id;
        IF v_other_pending = 0 THEN
            UPDATE pet SET adoption_status = 'available' WHERE pet_id = NEW.pet_id AND adoption_status = 'pending';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_foster_before_insert BEFORE INSERT ON foster_assignment FOR EACH ROW
BEGIN
    DECLARE v_role VARCHAR(20);
    DECLARE v_capacity INT;
    DECLARE v_active INT DEFAULT 0;
    DECLARE v_pet_status VARCHAR(20);
    SELECT role INTO v_role FROM users WHERE user_id = NEW.user_id;
    IF v_role IS NULL OR v_role <> 'foster' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only users with role foster can be assigned a foster placement';
    END IF;
    SELECT max_capacity INTO v_capacity FROM foster_profile WHERE user_id = NEW.user_id;
    IF v_capacity IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This foster caregiver has no foster profile';
    END IF;
    SELECT adoption_status INTO v_pet_status FROM pet WHERE pet_id = NEW.pet_id;
    IF v_pet_status = 'adopted' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'An adopted pet cannot be placed in foster care';
    END IF;
    IF NEW.status = 'active' THEN
        IF v_pet_status = 'fostered' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This pet is already in an active foster placement';
        END IF;
        SELECT COUNT(*) INTO v_active FROM foster_assignment WHERE user_id = NEW.user_id AND status = 'active';
        IF v_active >= v_capacity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Foster caregiver has reached maximum capacity';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_foster_after_insert AFTER INSERT ON foster_assignment FOR EACH ROW
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_active INT DEFAULT 0;
    IF NEW.status = 'active' THEN
        UPDATE pet SET adoption_status = 'fostered' WHERE pet_id = NEW.pet_id;
        SELECT max_capacity INTO v_capacity FROM foster_profile WHERE user_id = NEW.user_id;
        SELECT COUNT(*) INTO v_active FROM foster_assignment WHERE user_id = NEW.user_id AND status = 'active';
        IF v_active >= v_capacity THEN
            UPDATE foster_profile SET availability_status = 'full' WHERE user_id = NEW.user_id AND availability_status = 'available';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_foster_before_update BEFORE UPDATE ON foster_assignment FOR EACH ROW
BEGIN
    IF OLD.status <> 'active' AND NEW.status <> OLD.status THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A closed foster placement cannot change status';
    END IF;
    IF OLD.status = 'active' AND NEW.status IN ('completed', 'cancelled') AND NEW.end_date IS NULL THEN
        SET NEW.end_date = CURDATE();
    END IF;
END$$

CREATE TRIGGER trg_foster_after_update AFTER UPDATE ON foster_assignment FOR EACH ROW
BEGIN
    IF OLD.status = 'active' AND NEW.status IN ('completed', 'cancelled') THEN
        UPDATE pet SET adoption_status = 'available' WHERE pet_id = NEW.pet_id AND adoption_status = 'fostered';
        UPDATE foster_profile SET availability_status = 'available' WHERE user_id = NEW.user_id AND availability_status = 'full';
    END IF;
END$$

CREATE PROCEDURE sp_approve_application(IN p_application_id VARCHAR(12), IN p_reviewer_id VARCHAR(12))
BEGIN
    DECLARE v_pet VARCHAR(12);
    DECLARE v_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    START TRANSACTION;
    SELECT pet_id, status INTO v_pet, v_status FROM adoption_application WHERE application_id = p_application_id FOR UPDATE;
    IF v_pet IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Application not found';
    END IF;
    IF v_status <> 'pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a pending application can be approved';
    END IF;
    SELECT adoption_status INTO v_status FROM pet WHERE pet_id = v_pet FOR UPDATE;
    UPDATE adoption_application SET status = 'approved', reviewed_by = p_reviewer_id WHERE application_id = p_application_id;
    UPDATE adoption_application SET status = 'rejected', reviewed_by = p_reviewer_id WHERE pet_id = v_pet AND status = 'pending' AND application_id <> p_application_id;
    UPDATE foster_assignment SET status = 'completed' WHERE pet_id = v_pet AND status = 'active';
    COMMIT;
END$$

CREATE PROCEDURE sp_reject_application(IN p_application_id VARCHAR(12), IN p_reviewer_id VARCHAR(12))
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    START TRANSACTION;
    SELECT status INTO v_status FROM adoption_application WHERE application_id = p_application_id FOR UPDATE;
    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Application not found';
    END IF;
    IF v_status <> 'pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a pending application can be rejected';
    END IF;
    UPDATE adoption_application SET status = 'rejected', reviewed_by = p_reviewer_id WHERE application_id = p_application_id;
    COMMIT;
END$$

CREATE PROCEDURE sp_withdraw_application(IN p_application_id VARCHAR(12), IN p_user_id VARCHAR(12))
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_owner VARCHAR(12);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    START TRANSACTION;
    SELECT status, user_id INTO v_status, v_owner FROM adoption_application WHERE application_id = p_application_id FOR UPDATE;
    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Application not found';
    END IF;
    IF v_owner <> p_user_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only the applicant can withdraw this application';
    END IF;
    IF v_status <> 'pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only a pending application can be withdrawn';
    END IF;
    UPDATE adoption_application SET status = 'withdrawn' WHERE application_id = p_application_id;
    COMMIT;
END$$

CREATE PROCEDURE sp_place_foster(IN p_foster_id VARCHAR(12), IN p_user_id VARCHAR(12), IN p_pet_id VARCHAR(12), IN p_start_date DATE)
BEGIN
    DECLARE v_lock VARCHAR(12);
    DECLARE v_pet_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    START TRANSACTION;
    SELECT user_id INTO v_lock FROM foster_profile WHERE user_id = p_user_id FOR UPDATE;
    SELECT adoption_status INTO v_pet_status FROM pet WHERE pet_id = p_pet_id FOR UPDATE;
    INSERT INTO foster_assignment (foster_id, start_date, end_date, status, user_id, pet_id) VALUES (p_foster_id, COALESCE(p_start_date, CURDATE()), NULL, 'active', p_user_id, p_pet_id);
    COMMIT;
END$$

CREATE PROCEDURE sp_complete_foster(IN p_foster_id VARCHAR(12), IN p_end_date DATE)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    START TRANSACTION;
    SELECT status INTO v_status FROM foster_assignment WHERE foster_id = p_foster_id FOR UPDATE;
    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Foster assignment not found';
    END IF;
    IF v_status <> 'active' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only an active foster placement can be completed';
    END IF;
    UPDATE foster_assignment SET status = 'completed', end_date = COALESCE(p_end_date, CURDATE()) WHERE foster_id = p_foster_id;
    COMMIT;
END$$

CREATE PROCEDURE sp_upsert_pet_match(IN p_match_id VARCHAR(12), IN p_user_id VARCHAR(12), IN p_pet_id VARCHAR(12), IN p_score DECIMAL(5,2))
BEGIN
    INSERT INTO pet_match (match_id, match_score, generated_date, user_id, pet_id) VALUES (p_match_id, p_score, CURRENT_TIMESTAMP, p_user_id, p_pet_id) ON DUPLICATE KEY UPDATE match_score = VALUES(match_score), generated_date = CURRENT_TIMESTAMP;
END$$

CREATE PROCEDURE sp_top_matches(IN p_user_id VARCHAR(12), IN p_limit INT)
BEGIN
    SELECT m.pet_id, p.name AS pet_name, p.species, p.breed, s.shelter_name, m.match_score FROM pet_match m JOIN pet p ON p.pet_id = m.pet_id JOIN shelter s ON s.shelter_id = p.shelter_id WHERE m.user_id = p_user_id AND p.adoption_status = 'available' ORDER BY m.match_score DESC LIMIT p_limit;
END$$

DELIMITER ;

SELECT table_name AS view_name FROM information_schema.views WHERE table_schema = 'pawmatchdb' ORDER BY table_name;
SELECT trigger_name, event_manipulation AS event, action_timing AS timing, event_object_table AS on_table FROM information_schema.triggers WHERE trigger_schema = 'pawmatchdb' ORDER BY event_object_table, action_timing DESC, event_manipulation;
SELECT routine_name AS procedure_name FROM information_schema.routines WHERE routine_schema = 'pawmatchdb' AND routine_type = 'PROCEDURE' ORDER BY routine_name;
