# Altanon Learn - Learning Platform PRD

## Original Problem Statement
Design and develop a modern, responsive learning platform website named Altanon Learn (by Altanon AI Works Pvt Ltd) focused on teaching Agentic AI and Conversational AI. Core features: Student, Teacher, and Admin portals; Live and Recorded courses; Razorpay payments (INR); scheduling; video uploads; Claymorphism UI design.

## Architecture
- **Frontend**: React.js + TailwindCSS + Shadcn UI + Claymorphism design
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Payments**: Razorpay (LIVE keys - INR/UPI)
- **Design**: Claymorphism, Light theme, CSS gradient backgrounds

## What's Been Implemented
1. Full-stack scaffold (React + FastAPI + MongoDB)
2. Enhanced Claymorphism design (deep shadows, pillowy 3D, raw CSS gradient body, clay thumbnails)
3. Role-based auth (Admin, Student, Teacher) with JWT + cookies
4. Admin Dashboard: 7 tabs — Overview, Courses, Purchases, Enrollments, Users, Testimonials, Blog
5. Admin User Management: Create/Delete users with role selection
6. Admin Purchase Tracking: Student-Course-Amount purchase history
7. Admin Manual Enrollment: Enroll any student in any course, tracks Manual vs Payment source
8. Admin Blog Management: CRUD with PDF upload + external URL links (seeded with real AWS/Google/Salesforce doc links)
9. Admin Testimonials: Image file upload (fixed _id leak in create/update)
10. Admin Courses: Thumbnail upload + YouTube Playlist URL + stock image picker + clay thumbnails
11. ClayCourseThumbnail: CSS-generated clay-style course thumbnails (gradient + icon per course)
12. Enrolled Badge: Green "Enrolled" badge on courses for logged-in students
13. Teacher Dashboard (live class scheduling with Zoom link, syllabus editing, video library)
14. Student Dashboard (enrollments)
15. Course Management (Live/Recorded types, pricing in INR)
16. Razorpay payment integration (LIVE keys)
17. YouTube Playlist Integration — embedded per course
18. WhatsApp floating chat button (window.open wa.me/917875757511)
19. Landing page — dynamic testimonials/blogs/courses from API, real doc links
20. About Us page — Company info (Pune, 4 years, 30+ placements), contact cards
21. Navigation: Home, Courses, About Us links
22. Footer: Phone +91 7875757511, Email mentoriqventures@gmail.com, Location Pune
23. Emergent badge removed

## Key API Endpoints
- Auth: POST /api/auth/register, /api/auth/login, /api/auth/logout, GET /api/auth/me
- Courses: GET /api/courses, GET /api/courses/{id}, POST/PUT/DELETE /api/courses
- Course Videos: GET /api/courses/{id}/videos (enrolled students, admin, teacher only)
- Payments: POST /api/payments/create-order, POST /api/payments/verify
- Blogs: GET /api/blogs, GET /api/blogs/{id}, GET /api/blogs/{id}/pdf
- Admin Blogs: POST /api/admin/blogs, PUT /api/admin/blogs/{id}, DELETE /api/admin/blogs/{id}
- Admin Users: GET /api/admin/users, POST /api/admin/users, DELETE /api/admin/users/{id}
- Admin Enrollments: POST /api/admin/enroll, GET /api/admin/enrollments
- Enrollments: GET /api/enrollments, GET /api/enrollments/my-courses, GET /api/enrollments/check/{id}
- Admin: GET /api/admin/stats, GET /api/admin/purchases
- Uploads: POST /api/upload/image, GET /api/uploads/{filename}, GET /api/stock-images
- Testimonials: GET /api/testimonials, POST/PUT/DELETE /api/admin/testimonials

## Recent Changes (April 17, 2026)
- **Google Drive Video Integration**: Replaced YouTube embeds with Google Drive video support
  - Admin adds Drive video links per course via Admin → Courses → Edit → Google Drive Videos
  - Videos served ONLY to enrolled students via secure `/api/courses/{id}/videos` endpoint
  - Drive links hidden from public API responses and non-enrolled users
  - Video player with Day 1, Day 2... navigation list
  - "Course Videos Locked" with lock icon for non-enrolled users
  - YouTube playlist still supported as fallback
- Fixed Admin Enrollments "Unknown" bug (both user_id and student_id checked)
- Duplicate enrollment check covers both user_id and student_id fields

## Remaining / Upcoming Tasks
### P1
- Zoom API Integration (if user provides OAuth credentials)
### P2
- Student referral/coupon system
- Course completion certificates
### P3
- Modularize server.py into separate route files
