USE pawmatchdb;

UPDATE users SET password_hash = '$2b$10$wPixb68139YMupn/IvZPTe2Z54Uce.mlVUjyvLJyKH58F3c8QD/Qq' WHERE user_id = 'U001';
UPDATE users SET password_hash = '$2b$10$RWgGeIrIc5I1FsohHnQi7.6nzYcG6G.OBLRBZHE5wOs0VHsnYBnDu' WHERE user_id = 'U002';
UPDATE users SET password_hash = '$2b$10$82SWYyosWrUbcC0neVW38eQ8icVr6/yhS5LMmaHDM89BZncCai626' WHERE user_id = 'U003';
UPDATE users SET password_hash = '$2b$10$93CneAsMlnYdgk5Li8MpGukbyFJ2aTuMLLNRRXBTzVK8IOv8IzAOO' WHERE user_id = 'U004';
UPDATE users SET password_hash = '$2b$10$HNfe8scRldYu1pTMZj1tyuTaNHaDnTkAcwoCHvFeLxhZCOnQJ1bMS' WHERE user_id = 'U005';
UPDATE users SET password_hash = '$2b$10$svKpfPqifYawmLofwx52nOgHntPHcfOmQMaH.AHy6kMVyp5cMb/NW' WHERE user_id = 'U006';
UPDATE users SET password_hash = '$2b$10$xE7wl7lofA2jf7SEcNWRkO/yztIMyNZAwdQuOP9MUGtCs/p0f7osG' WHERE user_id = 'U007';
UPDATE users SET password_hash = '$2b$10$DQ5a9smct6rOPftV5S3RQuMoZVQ234BtQuHprYUCnnpo.SG/PKKO.' WHERE user_id = 'U008';
UPDATE users SET password_hash = '$2b$10$t.13rDef6XJHK39jn0AbjujQYnWusLbSV7C0CrLn8Yj1Z2bC1f1xe' WHERE user_id = 'U009';
UPDATE users SET password_hash = '$2b$10$ffyTbinrBEOpezcqcsvmYuNU0oDxY1Uqc2ZUfpvoe4Z8an1tjQKua' WHERE user_id = 'U010';
UPDATE users SET password_hash = '$2b$10$Vo7fGdbmi0NoMIMf15g1/.sDGveZ8rVvYDzghmYCCY4/konTjlcBu' WHERE user_id = 'U011';
UPDATE users SET password_hash = '$2b$10$BPYOLbkifTuTuOQuhFAj.OMHeHDMwQbmVwAhGwjl7CXRqY3kI/VEe' WHERE user_id = 'U012';

SELECT user_id, email, role FROM users ORDER BY user_id;
