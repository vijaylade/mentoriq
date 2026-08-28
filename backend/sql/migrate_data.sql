/*
Assumption:
1. Export MongoDB collections to JSON files.
2. Bulk-load each JSON file into staging tables with a single NVARCHAR(MAX) column named payload.
3. Run this script to transform Mongo-shaped JSON into the SQL Server schema.

Example staging tables:
    staging_users(payload NVARCHAR(MAX))
    staging_courses(payload NVARCHAR(MAX))
    staging_live_classes(payload NVARCHAR(MAX))
    staging_videos(payload NVARCHAR(MAX))
    staging_enrollments(payload NVARCHAR(MAX))
    staging_payment_transactions(payload NVARCHAR(MAX))
    staging_testimonials(payload NVARCHAR(MAX))
    staging_blogs(payload NVARCHAR(MAX))
    staging_password_reset_tokens(payload NVARCHAR(MAX))
*/

INSERT INTO users (id, email, password_hash, name, role, created_at)
SELECT
    COALESCE(JSON_VALUE(payload, '$.id'), JSON_VALUE(payload, '$._id.$oid')),
    LOWER(JSON_VALUE(payload, '$.email')),
    JSON_VALUE(payload, '$.password_hash'),
    JSON_VALUE(payload, '$.name'),
    JSON_VALUE(payload, '$.role'),
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.created_at.$date'), JSON_VALUE(payload, '$.created_at')) AS DATETIMEOFFSET)
FROM staging_users;
GO

INSERT INTO password_reset_tokens (token, user_id, expires_at, used)
SELECT
    JSON_VALUE(payload, '$.token'),
    JSON_VALUE(payload, '$.user_id'),
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.expires_at.$date'), JSON_VALUE(payload, '$.expires_at')) AS DATETIMEOFFSET),
    CASE WHEN JSON_VALUE(payload, '$.used') IN ('true', '1') THEN 1 ELSE 0 END
FROM staging_password_reset_tokens;
GO

INSERT INTO courses (id, title, description, category, instructor, instructor_id, thumbnail, duration, course_type, youtube_playlist, live_price, recorded_price, created_at)
SELECT
    JSON_VALUE(payload, '$.id'),
    JSON_VALUE(payload, '$.title'),
    JSON_VALUE(payload, '$.description'),
    JSON_VALUE(payload, '$.category'),
    JSON_VALUE(payload, '$.instructor'),
    JSON_VALUE(payload, '$.instructor_id'),
    COALESCE(JSON_VALUE(payload, '$.thumbnail'), ''),
    JSON_VALUE(payload, '$.duration'),
    JSON_VALUE(payload, '$.course_type'),
    JSON_VALUE(payload, '$.youtube_playlist'),
    TRY_CAST(JSON_VALUE(payload, '$.pricing.live') AS DECIMAL(10,2)),
    TRY_CAST(JSON_VALUE(payload, '$.pricing.recorded') AS DECIMAL(10,2)),
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.created_at.$date'), JSON_VALUE(payload, '$.created_at')) AS DATETIMEOFFSET)
FROM staging_courses;
GO

INSERT INTO course_syllabus_items (course_id, position, content)
SELECT
    JSON_VALUE(c.payload, '$.id'),
    j.[key] + 1,
    j.value
FROM staging_courses c
CROSS APPLY OPENJSON(c.payload, '$.syllabus') j;
GO

INSERT INTO course_drive_videos (course_id, position, title, drive_file_id)
SELECT
    JSON_VALUE(c.payload, '$.id'),
    j.[key] + 1,
    JSON_VALUE(j.value, '$.title'),
    JSON_VALUE(j.value, '$.drive_file_id')
FROM staging_courses c
CROSS APPLY OPENJSON(c.payload, '$.drive_videos') j;
GO

INSERT INTO live_classes (id, course_id, title, scheduled_at, zoom_link, duration, description, created_at)
SELECT
    JSON_VALUE(payload, '$.id'),
    JSON_VALUE(payload, '$.course_id'),
    JSON_VALUE(payload, '$.title'),
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.scheduled_at.$date'), JSON_VALUE(payload, '$.scheduled_at')) AS DATETIMEOFFSET),
    JSON_VALUE(payload, '$.zoom_link'),
    TRY_CAST(JSON_VALUE(payload, '$.duration') AS INT),
    JSON_VALUE(payload, '$.description'),
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.created_at.$date'), JSON_VALUE(payload, '$.created_at')) AS DATETIMEOFFSET)
FROM staging_live_classes;
GO

INSERT INTO videos (id, course_id, title, youtube_url, duration, [order], description, created_at)
SELECT
    JSON_VALUE(payload, '$.id'),
    JSON_VALUE(payload, '$.course_id'),
    JSON_VALUE(payload, '$.title'),
    JSON_VALUE(payload, '$.youtube_url'),
    TRY_CAST(JSON_VALUE(payload, '$.duration') AS INT),
    TRY_CAST(JSON_VALUE(payload, '$.order') AS INT),
    JSON_VALUE(payload, '$.description'),
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.created_at.$date'), JSON_VALUE(payload, '$.created_at')) AS DATETIMEOFFSET)
FROM staging_videos;
GO

INSERT INTO enrollments (id, user_id, student_id, course_id, enrollment_type, payment_status, is_subscription, subscription_active, manually_enrolled, enrolled_at, next_payment_due)
SELECT
    JSON_VALUE(payload, '$.id'),
    JSON_VALUE(payload, '$.user_id'),
    JSON_VALUE(payload, '$.student_id'),
    JSON_VALUE(payload, '$.course_id'),
    JSON_VALUE(payload, '$.enrollment_type'),
    JSON_VALUE(payload, '$.payment_status'),
    CASE WHEN JSON_VALUE(payload, '$.is_subscription') IN ('true', '1') THEN 1 WHEN JSON_VALUE(payload, '$.is_subscription') IN ('false', '0') THEN 0 ELSE NULL END,
    CASE WHEN JSON_VALUE(payload, '$.subscription_active') IN ('true', '1') THEN 1 WHEN JSON_VALUE(payload, '$.subscription_active') IN ('false', '0') THEN 0 ELSE NULL END,
    CASE WHEN JSON_VALUE(payload, '$.manually_enrolled') IN ('true', '1') THEN 1 WHEN JSON_VALUE(payload, '$.manually_enrolled') IN ('false', '0') THEN 0 ELSE NULL END,
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.enrolled_at.$date'), JSON_VALUE(payload, '$.enrolled_at')) AS DATETIMEOFFSET),
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.next_payment_due.$date'), JSON_VALUE(payload, '$.next_payment_due')) AS DATETIMEOFFSET)
FROM staging_enrollments;
GO

INSERT INTO payment_transactions (order_id, payment_id, user_id, course_id, enrollment_type, amount, currency, payment_status, is_subscription, created_at, updated_at)
SELECT
    JSON_VALUE(payload, '$.order_id'),
    JSON_VALUE(payload, '$.payment_id'),
    JSON_VALUE(payload, '$.user_id'),
    JSON_VALUE(payload, '$.course_id'),
    JSON_VALUE(payload, '$.enrollment_type'),
    TRY_CAST(JSON_VALUE(payload, '$.amount') AS DECIMAL(10,2)),
    JSON_VALUE(payload, '$.currency'),
    JSON_VALUE(payload, '$.payment_status'),
    CASE WHEN JSON_VALUE(payload, '$.is_subscription') IN ('true', '1') THEN 1 WHEN JSON_VALUE(payload, '$.is_subscription') IN ('false', '0') THEN 0 ELSE NULL END,
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.created_at.$date'), JSON_VALUE(payload, '$.created_at')) AS DATETIMEOFFSET),
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.updated_at.$date'), JSON_VALUE(payload, '$.updated_at')) AS DATETIMEOFFSET)
FROM staging_payment_transactions;
GO

INSERT INTO testimonials (id, name, role, content, image_url, rating)
SELECT
    JSON_VALUE(payload, '$.id'),
    JSON_VALUE(payload, '$.name'),
    JSON_VALUE(payload, '$.role'),
    JSON_VALUE(payload, '$.content'),
    JSON_VALUE(payload, '$.image_url'),
    TRY_CAST(JSON_VALUE(payload, '$.rating') AS INT)
FROM staging_testimonials;
GO

INSERT INTO blogs (id, title, category, excerpt, read_time, pdf_filename, read_more_link, created_at)
SELECT
    JSON_VALUE(payload, '$.id'),
    JSON_VALUE(payload, '$.title'),
    JSON_VALUE(payload, '$.category'),
    JSON_VALUE(payload, '$.excerpt'),
    JSON_VALUE(payload, '$.read_time'),
    JSON_VALUE(payload, '$.pdf_filename'),
    JSON_VALUE(payload, '$.read_more_link'),
    TRY_CAST(COALESCE(JSON_VALUE(payload, '$.created_at.$date'), JSON_VALUE(payload, '$.created_at')) AS DATETIMEOFFSET)
FROM staging_blogs;
GO

INSERT INTO   (blog_id, position, tag)
SELECT
    JSON_VALUE(b.payload, '$.id'),
    j.[key] + 1,
    j.value
FROM staging_blogs b
CROSS APPLY OPENJSON(b.payload, '$.tags') j;
GO
