USE pawmatchdb;

SELECT p.pet_id, p.name, p.species, p.breed, p.age, s.shelter_name, s.city FROM pet p JOIN shelter s ON s.shelter_id = p.shelter_id WHERE p.adoption_status = 'available' ORDER BY s.shelter_name, p.name;

SELECT s.shelter_name, p.adoption_status, COUNT(*) AS pets FROM shelter s JOIN pet p ON p.shelter_id = s.shelter_id GROUP BY s.shelter_name, p.adoption_status ORDER BY s.shelter_name, pets DESC;

SELECT s.shelter_name, COUNT(*) AS total_applications, SUM(a.status = 'approved') AS approved, ROUND(100 * SUM(a.status = 'approved') / COUNT(*), 1) AS approval_pct FROM adoption_application a JOIN pet p ON p.pet_id = a.pet_id JOIN shelter s ON s.shelter_id = p.shelter_id GROUP BY s.shelter_name HAVING COUNT(*) >= 2 ORDER BY approval_pct DESC;

SELECT p.pet_id, p.name, p.species, p.intake_date FROM pet p LEFT JOIN adoption_application a ON a.pet_id = p.pet_id WHERE a.application_id IS NULL AND p.adoption_status = 'available' ORDER BY p.intake_date;

SELECT * FROM v_foster_load WHERE spare_capacity > 0;

SELECT t.user_id, t.pet_name, t.match_score, t.rnk FROM (SELECT m.user_id, p.name AS pet_name, m.match_score, ROW_NUMBER() OVER (PARTITION BY m.user_id ORDER BY m.match_score DESC) AS rnk FROM pet_match m JOIN pet p ON p.pet_id = m.pet_id WHERE p.adoption_status = 'available') t WHERE t.rnk <= 2 ORDER BY t.user_id, t.rnk;

SELECT p.pet_id, p.name, m.vaccination_status, m.checkup_date, m.diagnosis FROM pet p JOIN medical_record m ON m.pet_id = p.pet_id WHERE m.record_no = (SELECT MAX(m2.record_no) FROM medical_record m2 WHERE m2.pet_id = p.pet_id) AND m.vaccination_status IN ('overdue', 'pending') ORDER BY m.vaccination_status, p.name;

SELECT CONCAT(u.first_name, ' ', u.last_name) AS reviewer, COUNT(*) AS reviewed, ROUND(AVG(DATEDIFF(a.decision_date, a.application_date)), 1) AS avg_days_to_decide FROM adoption_application a JOIN users u ON u.user_id = a.reviewed_by WHERE a.decision_date IS NOT NULL GROUP BY u.user_id, u.first_name, u.last_name ORDER BY reviewed DESC;

SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS adopter, COUNT(*) AS applications, GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') AS pets_applied_for FROM users u JOIN adoption_application a ON a.user_id = u.user_id JOIN pet p ON p.pet_id = a.pet_id GROUP BY u.user_id, u.first_name, u.last_name HAVING COUNT(*) > 1;

SELECT pet_id, name, species, temperament, MATCH(temperament, breed) AGAINST('calm quiet gentle' IN NATURAL LANGUAGE MODE) AS relevance FROM pet WHERE MATCH(temperament, breed) AGAINST('calm quiet gentle' IN NATURAL LANGUAGE MODE) ORDER BY relevance DESC;

SELECT fa.foster_id, p.name AS pet_name, CONCAT(u.first_name, ' ', u.last_name) AS foster_caregiver, fa.status, fa.start_date, fa.end_date, DATEDIFF(COALESCE(fa.end_date, CURDATE()), fa.start_date) AS days_in_foster FROM foster_assignment fa JOIN pet p ON p.pet_id = fa.pet_id JOIN users u ON u.user_id = fa.user_id ORDER BY fa.start_date;

SELECT s.shelter_name, COUNT(DISTINCT u.user_id) AS staff_members, COUNT(DISTINCT p.pet_id) AS pets FROM shelter s LEFT JOIN users u ON u.shelter_id = s.shelter_id LEFT JOIN pet p ON p.shelter_id = s.shelter_id GROUP BY s.shelter_id, s.shelter_name;

WITH avg_age AS (SELECT species, AVG(age) AS mean_age FROM pet GROUP BY species) SELECT p.name, p.species, p.age, ROUND(x.mean_age, 1) AS species_avg_age FROM pet p JOIN avg_age x ON x.species = p.species WHERE p.age > x.mean_age ORDER BY p.species, p.age DESC;

SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS name, u.role, GROUP_CONCAT(up.phone_no SEPARATOR ', ') AS phones FROM users u JOIN user_phone up ON up.user_id = u.user_id GROUP BY u.user_id, u.first_name, u.last_name, u.role HAVING COUNT(*) > 1;

SELECT * FROM v_shelter_summary;

SELECT * FROM v_available_pets;

SELECT * FROM v_application_details ORDER BY application_date;

SELECT * FROM v_pet_health ORDER BY pet_id;

SELECT * FROM v_user_recommendations ORDER BY user_id, match_score DESC;
