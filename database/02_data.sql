USE pawmatchdb;

INSERT INTO shelter (shelter_id, shelter_name, city, phone_no, email) VALUES
('S001', 'Happy Tails Shelter', 'Bengaluru', '+918041001001', 'contact@happytails.org'),
('S002', 'Paws and Claws Rescue', 'Mysuru', '+918212002002', 'hello@pawsandclaws.org'),
('S003', 'Second Chance Animal Haven', 'Hyderabad', '+914023003003', 'info@secondchancehaven.org');

INSERT INTO users (user_id, first_name, last_name, email, password_hash, role, date_joined, shelter_id) VALUES
('U001', 'Anita', 'Rao', 'anita.rao@pawmatch.in', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW1', 'admin', '2026-01-05', NULL),
('U002', 'Rahul', 'Menon', 'rahul.menon@happytails.org', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW2', 'shelter_staff', '2026-01-10', 'S001'),
('U003', 'Sneha', 'Iyer', 'sneha.iyer@pawsandclaws.org', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW3', 'shelter_staff', '2026-01-12', 'S002'),
('U004', 'Imran', 'Khan', 'imran.khan@secondchancehaven.org', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW4', 'shelter_staff', '2026-01-15', 'S003'),
('U005', 'Kiran', 'Patel', 'kiran.patel@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW5', 'adopter', '2026-02-01', NULL),
('U006', 'Meera', 'Nair', 'meera.nair@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW6', 'adopter', '2026-02-14', NULL),
('U007', 'Arjun', 'Das', 'arjun.das@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW7', 'adopter', '2026-03-03', NULL),
('U008', 'Divya', 'Sharma', 'divya.sharma@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW8', 'adopter', '2026-04-09', NULL),
('U009', 'Rohan', 'Gupta', 'rohan.gupta@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhW9', 'adopter', '2026-05-21', NULL),
('U010', 'Lakshmi', 'Reddy', 'lakshmi.reddy@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhX1', 'foster', '2026-02-20', NULL),
('U011', 'Vikram', 'Singh', 'vikram.singh@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhX2', 'foster', '2026-03-15', NULL),
('U012', 'Pooja', 'Joshi', 'pooja.joshi@gmail.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhX3', 'foster', '2026-04-02', NULL);

INSERT INTO user_phone (user_id, phone_no) VALUES
('U001', '+919800000001'),
('U002', '+919800000002'),
('U002', '+918041001011'),
('U003', '+919800000003'),
('U004', '+919800000004'),
('U005', '+919800000005'),
('U005', '+919900000005'),
('U006', '+919800000006'),
('U007', '+919800000007'),
('U008', '+919800000008'),
('U009', '+919800000009'),
('U010', '+919800000010'),
('U011', '+919800000011'),
('U011', '+919900000011'),
('U012', '+919800000012');

INSERT INTO adopter_profile (user_id, housing_type, has_yard, household_size) VALUES
('U005', 'house', 'Y', 4),
('U006', 'apartment', 'N', 2),
('U007', 'house', 'Y', 3),
('U008', 'apartment', 'N', 1),
('U009', 'farm', 'Y', 5);

INSERT INTO foster_profile (user_id, max_capacity, experience_years, availability_status) VALUES
('U010', 2, 3, 'available'),
('U011', 3, 5, 'available'),
('U012', 1, 1, 'full');

INSERT INTO pet (pet_id, name, species, breed, age, gender, temperament, adoption_status, intake_date, shelter_id) VALUES
('P001', 'Bruno', 'Dog', 'Labrador Retriever', 3, 'M', 'Friendly, energetic, great with kids', 'adopted', '2026-03-10', 'S001'),
('P002', 'Luna', 'Cat', 'Indian Shorthair', 2, 'F', 'Calm, affectionate, loves lap time', 'available', '2026-06-02', 'S001'),
('P003', 'Max', 'Dog', 'German Shepherd', 4, 'M', 'Loyal, protective, needs experienced owner', 'pending', '2026-05-14', 'S001'),
('P004', 'Bella', 'Dog', 'Beagle', 1, 'F', 'Playful, curious, good with other dogs', 'available', '2026-08-20', 'S001'),
('P005', 'Milo', 'Cat', 'Persian', 5, 'M', 'Quiet, independent, low energy', 'fostered', '2026-07-01', 'S002'),
('P006', 'Daisy', 'Dog', 'Indie', 2, 'F', 'Gentle, shy at first, bonds deeply', 'available', '2026-09-05', 'S002'),
('P007', 'Rocky', 'Dog', 'Boxer', 3, 'M', 'Active, goofy, loves long walks', 'adopted', '2026-02-18', 'S002'),
('P008', 'Coco', 'Rabbit', 'Holland Lop', 1, 'F', 'Docile, enjoys being held, quiet', 'available', '2026-09-18', 'S002'),
('P009', 'Simba', 'Cat', 'Maine Coon', 3, 'M', 'Social, playful, great with children', 'pending', '2026-08-01', 'S003'),
('P010', 'Rani', 'Dog', 'Indie', 6, 'F', 'Senior, calm, house-trained', 'fostered', '2026-04-22', 'S003'),
('P011', 'Oreo', 'Dog', 'Pug', 2, 'M', 'Cuddly, lazy, apartment friendly', 'available', '2026-10-02', 'S003'),
('P012', 'Pixie', 'Cat', 'Siamese', 1, 'F', 'Vocal, curious, very active', 'available', '2026-10-10', 'S003'),
('P013', 'Tyson', 'Dog', 'Rottweiler', 5, 'M', 'Strong, calm with family, needs space', 'available', '2026-07-15', 'S001'),
('P014', 'Nala', 'Cat', 'Indian Shorthair', 4, 'F', 'Shy, gentle, prefers quiet homes', 'fostered', '2026-06-20', 'S001'),
('P015', 'Charlie', 'Dog', 'Golden Retriever', 2, 'M', 'Friendly, trainable, loves water', 'available', '2026-10-20', 'S002');

INSERT INTO medical_record (pet_id, record_no, checkup_date, vaccination_status, diagnosis) VALUES
('P001', 1, '2026-03-12', 'up_to_date', 'Routine checkup'),
('P001', 2, '2026-09-01', 'up_to_date', NULL),
('P002', 1, '2026-06-04', 'up_to_date', 'Dewormed'),
('P003', 1, '2026-05-16', 'up_to_date', 'Mild hip dysplasia'),
('P003', 2, '2026-10-01', 'overdue', 'Booster due'),
('P004', 1, '2026-08-22', 'pending', 'Initial vaccination series in progress'),
('P005', 1, '2026-07-03', 'up_to_date', 'Dental cleaning recommended'),
('P006', 1, '2026-09-07', 'pending', 'Underweight on intake, on diet plan'),
('P007', 1, '2026-02-20', 'up_to_date', NULL),
('P008', 1, '2026-09-20', 'up_to_date', NULL),
('P009', 1, '2026-08-03', 'up_to_date', 'Mild ear infection treated'),
('P010', 1, '2026-04-24', 'up_to_date', 'Arthritis, on joint supplements'),
('P010', 2, '2026-10-05', 'overdue', 'Rabies booster overdue'),
('P011', 1, '2026-10-04', 'pending', NULL),
('P012', 1, '2026-10-12', 'pending', 'Initial vaccination due'),
('P013', 1, '2026-07-17', 'up_to_date', NULL),
('P014', 1, '2026-06-22', 'up_to_date', 'Stress related shyness noted'),
('P015', 1, '2026-10-22', 'pending', NULL);

INSERT INTO pet_image (pet_id, image_no, image_url, uploaded_date) VALUES
('P001', 1, '/images/pets/p001_1.jpg', '2026-03-11'),
('P001', 2, '/images/pets/p001_2.jpg', '2026-03-11'),
('P002', 1, '/images/pets/p002_1.jpg', '2026-06-03'),
('P003', 1, '/images/pets/p003_1.jpg', '2026-05-15'),
('P003', 2, '/images/pets/p003_2.jpg', '2026-05-15'),
('P004', 1, '/images/pets/p004_1.jpg', '2026-08-21'),
('P005', 1, '/images/pets/p005_1.jpg', '2026-07-02'),
('P006', 1, '/images/pets/p006_1.jpg', '2026-09-06'),
('P006', 2, '/images/pets/p006_2.jpg', '2026-09-06'),
('P007', 1, '/images/pets/p007_1.jpg', '2026-02-19'),
('P008', 1, '/images/pets/p008_1.jpg', '2026-09-19'),
('P009', 1, '/images/pets/p009_1.jpg', '2026-08-02'),
('P010', 1, '/images/pets/p010_1.jpg', '2026-04-23'),
('P011', 1, '/images/pets/p011_1.jpg', '2026-10-03'),
('P012', 1, '/images/pets/p012_1.jpg', '2026-10-11'),
('P013', 1, '/images/pets/p013_1.jpg', '2026-07-16'),
('P014', 1, '/images/pets/p014_1.jpg', '2026-06-21'),
('P015', 1, '/images/pets/p015_1.jpg', '2026-10-21');

INSERT INTO adoption_application (application_id, application_date, status, decision_date, user_id, pet_id, reviewed_by) VALUES
('A001', '2026-03-20', 'approved', '2026-03-25', 'U005', 'P001', 'U002'),
('A002', '2026-03-01', 'approved', '2026-03-08', 'U006', 'P007', 'U003'),
('A003', '2026-10-25', 'withdrawn', '2026-10-28', 'U009', 'P015', NULL),
('A004', '2026-10-15', 'pending', NULL, 'U007', 'P003', NULL),
('A005', '2026-10-28', 'pending', NULL, 'U008', 'P009', NULL),
('A006', '2026-03-18', 'rejected', '2026-03-25', 'U007', 'P001', 'U002'),
('A007', '2026-09-10', 'rejected', '2026-09-14', 'U005', 'P013', 'U002');

INSERT INTO foster_assignment (foster_id, start_date, end_date, status, user_id, pet_id) VALUES
('F001', '2026-07-05', NULL, 'active', 'U010', 'P005'),
('F002', '2026-05-01', NULL, 'active', 'U011', 'P010'),
('F003', '2026-06-25', NULL, 'active', 'U012', 'P014'),
('F004', '2026-06-10', '2026-07-20', 'completed', 'U010', 'P002'),
('F005', '2026-09-01', '2026-09-03', 'cancelled', 'U011', 'P004');

INSERT INTO pet_match (match_id, match_score, generated_date, user_id, pet_id) VALUES
('M001', 87.50, '2026-10-30 10:15:00', 'U005', 'P002'),
('M002', 78.25, '2026-10-30 10:15:00', 'U005', 'P004'),
('M003', 64.00, '2026-10-30 10:15:00', 'U005', 'P013'),
('M004', 91.30, '2026-10-31 09:00:00', 'U006', 'P006'),
('M005', 72.10, '2026-10-31 09:00:00', 'U006', 'P008'),
('M006', 83.40, '2026-10-31 09:00:00', 'U006', 'P002'),
('M007', 88.90, '2026-11-01 14:30:00', 'U007', 'P011'),
('M008', 81.00, '2026-11-01 14:30:00', 'U007', 'P004'),
('M009', 85.00, '2026-11-01 14:30:00', 'U007', 'P003'),
('M010', 76.50, '2026-11-02 11:45:00', 'U008', 'P011'),
('M011', 90.20, '2026-11-02 11:45:00', 'U008', 'P012'),
('M012', 89.00, '2026-11-02 11:45:00', 'U008', 'P009'),
('M013', 93.75, '2026-11-03 16:20:00', 'U009', 'P015'),
('M014', 70.00, '2026-11-03 16:20:00', 'U009', 'P004');

SELECT 'shelter' AS tbl, COUNT(*) AS row_count FROM shelter
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'user_phone', COUNT(*) FROM user_phone
UNION ALL SELECT 'adopter_profile', COUNT(*) FROM adopter_profile
UNION ALL SELECT 'foster_profile', COUNT(*) FROM foster_profile
UNION ALL SELECT 'pet', COUNT(*) FROM pet
UNION ALL SELECT 'medical_record', COUNT(*) FROM medical_record
UNION ALL SELECT 'pet_image', COUNT(*) FROM pet_image
UNION ALL SELECT 'adoption_application', COUNT(*) FROM adoption_application
UNION ALL SELECT 'foster_assignment', COUNT(*) FROM foster_assignment
UNION ALL SELECT 'pet_match', COUNT(*) FROM pet_match;
