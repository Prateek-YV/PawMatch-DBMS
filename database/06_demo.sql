USE pawmatchdb;

SELECT pet_id, name, adoption_status FROM pet WHERE pet_id IN ('P002', 'P003', 'P004');
SELECT * FROM v_foster_load;

CALL sp_place_foster('F006', 'U011', 'P002', '2026-11-05');
SELECT pet_id, name, adoption_status FROM pet WHERE pet_id = 'P002';
SELECT * FROM v_foster_load;

CALL sp_complete_foster('F006', '2026-11-06');
SELECT pet_id, name, adoption_status FROM pet WHERE pet_id = 'P002';

INSERT INTO adoption_application (application_id, application_date, status, decision_date, user_id, pet_id, reviewed_by) VALUES ('A008', '2026-11-04', 'pending', NULL, 'U006', 'P003', NULL);
SELECT application_id, applicant, pet_name, status, reviewer FROM v_application_details WHERE pet_id = 'P003';

CALL sp_approve_application('A004', 'U002');
SELECT application_id, applicant, pet_name, status, decision_date, reviewer FROM v_application_details WHERE pet_id = 'P003';
SELECT pet_id, name, adoption_status FROM pet WHERE pet_id = 'P003';

INSERT INTO adoption_application (application_id, application_date, status, decision_date, user_id, pet_id, reviewed_by) VALUES ('A009', '2026-11-04', 'pending', NULL, 'U009', 'P004', NULL);
SELECT pet_id, name, adoption_status FROM pet WHERE pet_id = 'P004';
CALL sp_withdraw_application('A009', 'U009');
SELECT pet_id, name, adoption_status FROM pet WHERE pet_id = 'P004';

CALL sp_upsert_pet_match('M015', 'U005', 'P011', 82.40);
CALL sp_upsert_pet_match('M016', 'U005', 'P002', 90.00);
CALL sp_top_matches('U005', 3);
