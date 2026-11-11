<<<<<<< HEAD
# PawMatch - Smart Pet Adoption and Foster Matching Platform

DBMS Level 3 mini project. Next.js (App Router) front end with **embedded SQL written directly in the page and server-action files**, MySQL as the main database, and MongoDB for preference storage, activity logs and pet matching.

## 1. Prerequisites
- Node.js 20+ and npm
- MySQL 8.0.19+ (running)
- MongoDB 6+ (running on `mongodb://127.0.0.1:27017`) and `mongosh`

## 2. Set up the databases (run in this order)
Open the MySQL command line client in the `database` folder:

```
SOURCE 01_ddl.sql;
SOURCE 02_data.sql;
SOURCE 03_advanced.sql;
SOURCE 04_passwords.sql;
```

Then load MongoDB:

```
mongosh mongo_01_setup.js
```

Optional demo files: `05_queries.sql`, `06_demo.sql` (changes data, reload 01-04 before running it again), `mongo_02_queries.js`.

## 3. Configure and run the web app
```
npm install
copy .env.example .env.local        (Windows)   |   cp .env.example .env.local   (Mac/Linux)
```
Edit `.env.local` and set `DB_PASSWORD` (and `DB_USER` if it is not root). Then:

```
npm run dev
```
Open http://localhost:3000

## 4. Demo accounts (password for all: `Pass@123`)
| Role | Email |
|---|---|
| Admin | anita.rao@pawmatch.in |
| Shelter staff (Happy Tails) | rahul.menon@happytails.org |
| Shelter staff (Paws and Claws) | sneha.iyer@pawsandclaws.org |
| Adopter | kiran.patel@gmail.com, meera.nair@gmail.com |
| Foster caregiver | lakshmi.reddy@gmail.com, vikram.singh@gmail.com |

Passwords are stored as bcrypt hashes, never in plain text.

## 5. Where the embedded SQL lives
Every SQL statement is written inline in the Next.js code (parameterised with `?`, run through the `mysql2` pool in `lib/db.js`). There is no ORM and no query builder. Each page also has a "View embedded SQL" panel showing the exact statement it ran.

| File | Embedded SQL |
|---|---|
| `app/page.js` | dashboard stats, views, `CALL sp_top_matches` |
| `app/pets/page.js` | JOIN, dynamic WHERE, FULLTEXT `MATCH ... AGAINST`, GROUP BY/HAVING |
| `app/pets/[id]/page.js` | JOIN, subqueries, medical history |
| `app/pets/actions.js` | INSERT application, `CALL sp_place_foster` |
| `app/applications/*` | JOIN review queue, `CALL sp_approve_application / sp_reject_application / sp_withdraw_application` |
| `app/fosters/*` | views, DATEDIFF, `CALL sp_place_foster / sp_complete_foster` |
| `app/staff/pets/*` | INSERT / UPDATE / DELETE on pet, medical_record, pet_image |
| `app/recommendations/*` | `CALL sp_upsert_pet_match`, `CALL sp_top_matches` |
| `app/reports/page.js` | 9 analytical queries: JOIN, GROUP BY, HAVING, subquery, window function, CTE |
| `app/admin/users/*` | UPDATE / DELETE users, INSERT shelter |
| `app/login`, `app/register` | SELECT user, transactional INSERT of user, phone and profile |

## 6. Requirement checklist
- SQL + NoSQL: MySQL (users, pets, applications, fosters, medical records) + MongoDB (`pet_profiles`, `user_preferences`, `user_activity`).
- DDL: CREATE, ALTER (patches in `03_advanced.sql`), DROP, PK/FK, CHECK/UNIQUE/DEFAULT, indexes, 6 views.
- DML: INSERT, UPDATE, DELETE, SELECT with JOIN, GROUP BY, HAVING, ORDER BY, aggregates, subqueries.
- Advanced features: transactions (stored procedures), triggers (8), views (6), stored procedures (7), indexing (8 incl. FULLTEXT), full-text search, NoSQL aggregation, vector similarity (cosine similarity in a MongoDB aggregation pipeline).
- Roles: admin, shelter_staff, adopter, foster (role checks on every page and action).
- Validation at database level: CHECK constraints, ENUMs, triggers, MongoDB `$jsonSchema` validators.
- Security: bcrypt password hashes, signed httpOnly session cookie, parameterised queries, credentials in environment variables.

## 7. How matching works
1. The adopter saves preferences (stored in MongoDB `user_preferences`, with a 5-number preference vector).
2. "Find my matches" runs a MongoDB aggregation over `pet_profiles`: filters by species/size/kids/yard/experience, computes cosine similarity between the vectors, adds a bonus for shared traits, and returns the top pets.
3. Results are re-checked against MySQL (only pets that are still `available`) and written to the SQL `pet_match` table with `CALL sp_upsert_pet_match(...)`.
4. The page reads them back with `CALL sp_top_matches(...)`.

## 8. ER diagram and schema
See `database/pawmatch_erd.png` and `database/pawmatch_relational_schema.png`.
=======
# PawMatch-DBMS
>>>>>>> a6eb4aab6abe140bd19c08eb2cfcf6c8e183b46a
