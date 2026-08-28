CREATE TABLE users (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at DATETIMEOFFSET NOT NULL
);
GO

CREATE TABLE password_reset_tokens (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    expires_at DATETIMEOFFSET NOT NULL,
    used BIT NOT NULL CONSTRAINT DF_password_reset_tokens_used DEFAULT 0
);
GO

CREATE TABLE courses (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    category VARCHAR(255) NOT NULL,
    instructor VARCHAR(255) NOT NULL,
    instructor_id VARCHAR(36) NULL,
    thumbnail NVARCHAR(MAX) NOT NULL,
    duration VARCHAR(255) NULL,
    course_type VARCHAR(50) NULL,
    youtube_playlist NVARCHAR(MAX) NULL,
    live_price DECIMAL(10,2) NULL,
    recorded_price DECIMAL(10,2) NULL,
    created_at DATETIMEOFFSET NOT NULL
);
GO

CREATE TABLE course_syllabus_items (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    position INT NOT NULL,
    content NVARCHAR(MAX) NOT NULL
);
GO

CREATE TABLE course_drive_videos (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    position INT NOT NULL,
    title VARCHAR(255) NULL,
    drive_file_id VARCHAR(255) NULL
);
GO

CREATE TABLE live_classes (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    scheduled_at DATETIMEOFFSET NOT NULL,
    zoom_link NVARCHAR(MAX) NOT NULL,
    duration INT NOT NULL,
    description NVARCHAR(MAX) NULL,
    created_at DATETIMEOFFSET NOT NULL
);
GO

CREATE TABLE videos (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    youtube_url NVARCHAR(MAX) NOT NULL,
    duration INT NULL,
    [order] INT NOT NULL,
    description NVARCHAR(MAX) NULL,
    created_at DATETIMEOFFSET NOT NULL
);
GO

CREATE TABLE enrollments (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    student_id VARCHAR(36) NULL,
    course_id VARCHAR(36) NOT NULL,
    enrollment_type VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NULL,
    is_subscription BIT NULL,
    subscription_active BIT NULL,
    manually_enrolled BIT NULL,
    enrolled_at DATETIMEOFFSET NOT NULL,
    next_payment_due DATETIMEOFFSET NULL
);
GO

CREATE TABLE payment_transactions (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) NULL,
    user_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    enrollment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    is_subscription BIT NULL,
    created_at DATETIMEOFFSET NOT NULL,
    updated_at DATETIMEOFFSET NULL
);
GO

CREATE TABLE testimonials (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    image_url NVARCHAR(MAX) NULL,
    rating INT NULL
);
GO

CREATE TABLE blogs (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    excerpt NVARCHAR(MAX) NOT NULL,
    read_time VARCHAR(100) NOT NULL,
    pdf_filename VARCHAR(255) NULL,
    read_more_link NVARCHAR(MAX) NULL,
    created_at DATETIMEOFFSET NOT NULL
);
GO

CREATE TABLE blog_tags (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    blog_id VARCHAR(36) NOT NULL,
    position INT NOT NULL,
    tag VARCHAR(255) NOT NULL
);
GO
