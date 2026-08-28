ALTER TABLE password_reset_tokens
ADD CONSTRAINT FK_password_reset_tokens_user
FOREIGN KEY (user_id) REFERENCES users(id);
GO

ALTER TABLE courses
ADD CONSTRAINT FK_courses_instructor
FOREIGN KEY (instructor_id) REFERENCES users(id);
GO

ALTER TABLE course_syllabus_items
ADD CONSTRAINT FK_course_syllabus_items_course
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
GO

ALTER TABLE course_drive_videos
ADD CONSTRAINT FK_course_drive_videos_course
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
GO

ALTER TABLE live_classes
ADD CONSTRAINT FK_live_classes_course
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
GO

ALTER TABLE videos
ADD CONSTRAINT FK_videos_course
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
GO

ALTER TABLE enrollments
ADD CONSTRAINT FK_enrollments_user
FOREIGN KEY (user_id) REFERENCES users(id);
GO

ALTER TABLE enrollments
ADD CONSTRAINT FK_enrollments_student
FOREIGN KEY (student_id) REFERENCES users(id);
GO

ALTER TABLE enrollments
ADD CONSTRAINT FK_enrollments_course
FOREIGN KEY (course_id) REFERENCES courses(id);
GO

ALTER TABLE payment_transactions
ADD CONSTRAINT FK_payment_transactions_user
FOREIGN KEY (user_id) REFERENCES users(id);
GO

ALTER TABLE payment_transactions
ADD CONSTRAINT FK_payment_transactions_course
FOREIGN KEY (course_id) REFERENCES courses(id);
GO

ALTER TABLE blog_tags
ADD CONSTRAINT FK_blog_tags_blog
FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE;
GO
