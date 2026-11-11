DROP DATABASE IF EXISTS pawmatchdb;
CREATE DATABASE pawmatchdb;
USE pawmatchdb;
CREATE TABLE shelter (
    shelter_id      VARCHAR(10)     NOT NULL,
    shelter_name    VARCHAR(60)     NOT NULL,
    city            VARCHAR(40)     NOT NULL,
    phone_no        VARCHAR(15)     NOT NULL,
    email           VARCHAR(60)     NOT NULL,
    CONSTRAINT pk_shelter PRIMARY KEY (shelter_id),
    CONSTRAINT uq_shelter_email UNIQUE (email)
);
CREATE TABLE users (
    user_id         VARCHAR(12)     NOT NULL,
    first_name      VARCHAR(30)     NOT NULL,
    last_name       VARCHAR(30)     NOT NULL,
    email           VARCHAR(60)     NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    role            ENUM('admin','shelter_staff','adopter','foster') NOT NULL DEFAULT 'adopter',
    date_joined     DATE            NOT NULL DEFAULT (CURRENT_DATE),
    shelter_id      VARCHAR(10)     NULL,
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_shelter FOREIGN KEY (shelter_id)
        REFERENCES shelter(shelter_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE user_phone (
    user_id         VARCHAR(12)     NOT NULL,
    phone_no        VARCHAR(15)     NOT NULL,
    CONSTRAINT pk_user_phone PRIMARY KEY (user_id, phone_no),
    CONSTRAINT fk_user_phone_user FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE adopter_profile (
    user_id         VARCHAR(12)     NOT NULL,
    housing_type    VARCHAR(20)     NOT NULL,
    has_yard        CHAR(1)         NOT NULL DEFAULT 'N',
    household_size  INT             NOT NULL DEFAULT 1,
    CONSTRAINT pk_adopter_profile PRIMARY KEY (user_id),
    CONSTRAINT fk_adopter_profile_user FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_adopter_has_yard CHECK (has_yard IN ('Y','N')),
    CONSTRAINT chk_adopter_household CHECK (household_size >= 1)
);
CREATE TABLE foster_profile (
    user_id             VARCHAR(12)     NOT NULL,
    max_capacity        INT             NOT NULL DEFAULT 1,
    experience_years     INT             NOT NULL DEFAULT 0,
    availability_status  VARCHAR(20)     NOT NULL DEFAULT 'available',
    CONSTRAINT pk_foster_profile PRIMARY KEY (user_id),
    CONSTRAINT fk_foster_profile_user FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_foster_capacity CHECK (max_capacity >= 1),
    CONSTRAINT chk_foster_experience CHECK (experience_years >= 0)
);
CREATE TABLE pet (
    pet_id          VARCHAR(12)     NOT NULL,
    name            VARCHAR(40)     NOT NULL,
    species         VARCHAR(30)     NOT NULL,
    breed           VARCHAR(40)     NULL,
    age             INT             NOT NULL DEFAULT 0,
    gender          ENUM('M','F','U') NOT NULL DEFAULT 'U',
    temperament     VARCHAR(255)    NULL,
    adoption_status ENUM('available','pending','fostered','adopted') NOT NULL DEFAULT 'available',
    intake_date     DATE            NOT NULL,
    shelter_id      VARCHAR(10)     NOT NULL,
    CONSTRAINT pk_pet PRIMARY KEY (pet_id),
    CONSTRAINT fk_pet_shelter FOREIGN KEY (shelter_id)
        REFERENCES shelter(shelter_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_pet_age CHECK (age >= 0)
);
CREATE TABLE medical_record (
    pet_id              VARCHAR(12)     NOT NULL,
    record_no           INT             NOT NULL,
    checkup_date        DATE            NOT NULL,
    vaccination_status  VARCHAR(30)     NOT NULL DEFAULT 'pending',
    diagnosis           VARCHAR(255)    NULL,
    CONSTRAINT pk_medical_record PRIMARY KEY (pet_id, record_no),
    CONSTRAINT fk_medical_record_pet FOREIGN KEY (pet_id)
        REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE pet_image (
    pet_id          VARCHAR(12)     NOT NULL,
    image_no        INT             NOT NULL,
    image_url       VARCHAR(255)    NOT NULL,
    uploaded_date   DATE            NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT pk_pet_image PRIMARY KEY (pet_id, image_no),
    CONSTRAINT fk_pet_image_pet FOREIGN KEY (pet_id)
        REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE adoption_application (
    application_id  VARCHAR(12)     NOT NULL,
    application_date DATE           NOT NULL DEFAULT (CURRENT_DATE),
    status          ENUM('pending','approved','rejected','withdrawn') NOT NULL DEFAULT 'pending',
    decision_date   DATE            NULL,
    user_id         VARCHAR(12)     NOT NULL,
    pet_id          VARCHAR(12)     NOT NULL,
    reviewed_by     VARCHAR(12)     NULL,
    CONSTRAINT pk_adoption_application PRIMARY KEY (application_id),
    CONSTRAINT fk_application_adopter FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_application_pet FOREIGN KEY (pet_id)
        REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_application_reviewer FOREIGN KEY (reviewed_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_application_dates CHECK (decision_date IS NULL OR decision_date >= application_date)
);
CREATE TABLE foster_assignment (
    foster_id       VARCHAR(12)     NOT NULL,
    start_date      DATE            NOT NULL,
    end_date        DATE            NULL,
    status          ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
    user_id         VARCHAR(12)     NOT NULL,
    pet_id          VARCHAR(12)     NOT NULL,
    CONSTRAINT pk_foster_assignment PRIMARY KEY (foster_id),
    CONSTRAINT fk_foster_assignment_user FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_foster_assignment_pet FOREIGN KEY (pet_id)
        REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_foster_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE TABLE pet_match (
    match_id        VARCHAR(12)     NOT NULL,
    match_score     DECIMAL(5,2)    NOT NULL,
    generated_date  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id         VARCHAR(12)     NOT NULL,
    pet_id          VARCHAR(12)     NOT NULL,
    CONSTRAINT pk_pet_match PRIMARY KEY (match_id),
    CONSTRAINT fk_pet_match_user FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pet_match_pet FOREIGN KEY (pet_id)
        REFERENCES pet(pet_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_pet_match_score CHECK (match_score BETWEEN 0 AND 100)
);
SHOW TABLES;
