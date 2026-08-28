CREATE UNIQUE INDEX UX_users_email ON users(email);
GO

CREATE UNIQUE INDEX UX_password_reset_tokens_token ON password_reset_tokens(token);
GO

CREATE INDEX IX_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
GO

CREATE INDEX IX_courses_category ON courses(category);
GO

CREATE INDEX IX_courses_instructor_id ON courses(instructor_id);
GO

CREATE INDEX IX_courses_created_at ON courses(created_at DESC);
GO

CREATE UNIQUE INDEX UX_course_syllabus_items_course_position ON course_syllabus_items(course_id, position);
GO

CREATE UNIQUE INDEX UX_course_drive_videos_course_position ON course_drive_videos(course_id, position);
GO

CREATE INDEX IX_live_classes_course_scheduled ON live_classes(course_id, scheduled_at DESC);
GO

CREATE INDEX IX_videos_course_order ON videos(course_id, [order]);
GO

CREATE INDEX IX_enrollments_lookup_user ON enrollments(user_id, course_id);
GO

CREATE INDEX IX_enrollments_lookup_student ON enrollments(student_id, course_id);
GO

CREATE INDEX IX_enrollments_enrolled_at ON enrollments(enrolled_at DESC);
GO

CREATE UNIQUE INDEX UX_payment_transactions_order_id ON payment_transactions(order_id);
GO

CREATE UNIQUE INDEX UX_payment_transactions_payment_id ON payment_transactions(payment_id) WHERE payment_id IS NOT NULL;
GO

CREATE INDEX IX_payment_transactions_status_created_at ON payment_transactions(payment_status, created_at DESC);
GO

CREATE INDEX IX_testimonials_rating ON testimonials(rating);
GO

CREATE INDEX IX_blogs_created_at ON blogs(created_at DESC);
GO

CREATE INDEX IX_blogs_category ON blogs(category);
GO

CREATE UNIQUE INDEX UX_blog_tags_blog_position ON blog_tags(blog_id, position);
GO
