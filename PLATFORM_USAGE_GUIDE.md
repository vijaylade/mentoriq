# MentoriQ Platform Usage Guide

## Table of Contents
1. [Admin Panel Guide](#admin-panel-guide)
2. [Teacher Panel Guide](#teacher-panel-guide)
3. [Payment System Setup](#payment-system-setup)
4. [Video Management](#video-management)
5. [Live Classes Setup](#live-classes-setup)

---

## Admin Panel Guide

### Access
- **URL**: Login at `/login` with admin credentials
- **Credentials**: admin@mentoriq.com / Admin@123
- After login, you'll be redirected to `/admin`

### Dashboard Tabs

#### 1. Overview Tab
Shows platform statistics:
- Total Users
- Total Courses
- Total Enrollments
- Total Revenue (in ₹)

#### 2. Courses Tab
**Manage all courses on the platform**

**To Add a New Course:**
1. Click "Add Course" button
2. Fill in the form:
   - **Course Title**: e.g., "Advanced AI with GPT-4"
   - **Description**: Detailed course description
   - **Category**: e.g., "Agentic AI", "Conversational AI", "Contact Center AI"
   - **Instructor Name**: Teacher's full name
   - **Live Class Price (₹)**: Price for live sessions (e.g., 4999.00)
   - **Recorded Price (₹)**: Price for recorded content (e.g., 2499.00)
   - **Duration**: e.g., "8 weeks", "3 months"
   - **Thumbnail URL**: Image URL for course card
   - **Syllabus**: One topic per line, e.g.:
     ```
     Introduction to AI
     AWS Lex Fundamentals
     Lambda Integration
     Deployment Strategies
     ```
3. Click "Create Course"

**To Edit a Course:**
1. Click the edit icon (pencil) on any course
2. Modify fields as needed
3. Click "Update Course"

**To Delete a Course:**
1. Click the delete icon (trash) on any course
2. Confirm deletion

#### 3. Testimonials Tab
**Manage student testimonials**

**To Add a Testimonial:**
1. Click "Add Testimonial"
2. Fill in:
   - **Name**: Student name
   - **Role/Position**: e.g., "AI Engineer at Google"
   - **Content**: Testimonial text
   - **Image URL**: Student photo URL
   - **Rating**: 1-5 stars
3. Click "Create"

**To Edit/Delete:**
- Use Edit or Delete buttons on each testimonial card

#### 4. Users Tab
View all registered users with their:
- Name
- Email
- Role (admin/teacher/student)
- Registration date

---

## Teacher Panel Guide

### Access
- **Credentials**: teacher@mentoriq.com / Teacher@123
- After login, redirected to `/teacher`

### Dashboard Features

#### Stats Overview
- Total Students enrolled in your courses
- Active Courses you're teaching
- Scheduled Classes count

#### Live Classes Tab
**Schedule and manage live sessions**

**To Schedule a Class:**
1. Click "Schedule Class"
2. Fill in:
   - **Course**: Select from your courses
   - **Class Title**: e.g., "AWS Lex Deep Dive"
   - **Date & Time**: Pick date and time
   - **Zoom Link**: Your Zoom meeting URL
   - **Duration**: Minutes (e.g., 60, 90, 120)
3. Click "Schedule Class"

**To Start a Class:**
- Click "Start Class" button
- Opens Zoom link in new tab

#### My Courses Tab
**Edit course syllabus**

**To Edit Syllabus:**
1. Click "Edit Syllabus" on any course
2. Modify syllabus (one topic per line)
3. Click "Save Changes"

---

## Payment System Setup

### Stripe Integration (Already Configured!)

The platform uses **Stripe** for payments with test mode enabled.

#### Current Setup:
- **Test API Key**: `sk_test_emergent` (already configured)
- **Currency**: Indian Rupees (INR)
- **Payment Methods**: Card payments

#### How Payment Works:

**Student Enrollment Flow:**
1. Student browses courses at `/courses`
2. Clicks on a course to view details
3. Chooses enrollment type:
   - **Live Classes**: Interactive sessions with instructor
   - **Recorded Course**: Self-paced video content
4. Clicks "Enroll in Live" or "Enroll in Recorded"
5. Redirected to Stripe Checkout
6. Completes payment
7. Redirected back to platform
8. Payment verified automatically
9. Course access granted

#### Payment Verification:
- System polls payment status every 2 seconds (max 5 attempts)
- Once payment confirmed, enrollment is created
- Student can access course from dashboard

#### Admin Revenue Tracking:
- View total revenue in Overview tab
- All transactions stored in database
- Revenue displayed in ₹ (INR)

### Going Live with Real Payments:

**To use real Stripe payments:**
1. **Get Stripe Account**:
   - Sign up at https://stripe.com
   - Complete business verification

2. **Get Live API Keys**:
   - Dashboard → Developers → API Keys
   - Copy "Secret key" (starts with `sk_live_`)

3. **Update Backend**:
   - Edit `/app/backend/.env`
   - Replace: `STRIPE_API_KEY="sk_test_emergent"`
   - With: `STRIPE_API_KEY="sk_live_YOUR_KEY_HERE"`
   - Restart backend: `sudo supervisorctl restart backend`

4. **Enable INR Currency**:
   - Stripe Dashboard → Settings → Payment methods
   - Enable Indian payment methods
   - Set default currency to INR

5. **Test Live Payments**:
   - Use real card (will charge actual money)
   - Verify transaction in Stripe Dashboard

---

## Video Management

### For Recorded Courses (YouTube)

**Setup:**
1. Upload course videos to YouTube
2. Set videos as "Unlisted" or "Public"
3. Copy video URLs

**Adding Videos (Admin):**
Currently videos are referenced in course descriptions. 

**For Teachers to Add Videos:**
The backend API is ready at `/api/videos`

**To add video management UI:**
Teachers need a form with:
- Course selection
- Video title
- YouTube URL
- Duration (optional)
- Order number
- Description

**YouTube Embed Format:**
```
https://www.youtube.com/watch?v=VIDEO_ID
```

**Future Enhancement:**
Add a "Videos" tab in Teacher Dashboard with:
- List of uploaded videos per course
- Add/Edit/Delete functionality
- Video preview

---

## Live Classes Setup

### Zoom Integration (Current Setup)

**How It Works:**
1. Teachers create Zoom meetings separately
2. Copy Zoom meeting URL
3. Add to platform when scheduling class
4. Students click "Join Class" → Opens Zoom

### Setting Up Zoom:

**Option 1: Free Zoom Account**
1. Sign up at https://zoom.us
2. Click "Schedule a Meeting"
3. Set date, time, duration
4. Copy meeting link
5. Paste in MentoriQ when scheduling

**Option 2: Recurring Meetings**
1. Create a recurring Zoom meeting
2. Use same link for all classes
3. Just update meeting time in Zoom

### Alternative: Native Video Platform

**To build in-platform video:**
Would need:
- WebRTC implementation (Daily.co, Agora, Twilio)
- Video/audio permissions
- Chat functionality
- Screen sharing
- Recording capability

**Recommended Services:**
- **Daily.co**: Easy integration, generous free tier
- **Agora**: Better for large scale
- **Twilio**: Enterprise grade

---

## Quick Reference

### Important URLs:
- **Landing Page**: `/`
- **Courses**: `/courses`
- **Login**: `/login`
- **Register**: `/register`
- **Admin Dashboard**: `/admin`
- **Teacher Dashboard**: `/teacher`
- **Student Dashboard**: `/dashboard`

### Test Accounts:
```
Admin:
  Email: admin@mentoriq.com
  Password: Admin@123

Teacher:
  Email: teacher@mentoriq.com
  Password: Teacher@123

Student:
  Email: student@test.com
  Password: Test@123
```

### API Endpoints:
- Courses: `/api/courses`
- Live Classes: `/api/live-classes`
- Videos: `/api/videos`
- Payments: `/api/payments/checkout`
- Testimonials: `/api/testimonials`

### Currency:
- All prices in **Indian Rupees (₹)**
- Backend uses `"inr"` currency code
- Stripe processes in INR

---

## Support

For technical issues:
1. Check browser console for errors
2. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
3. Verify environment variables in `/app/backend/.env`
4. Restart services: `sudo supervisorctl restart backend frontend`

---

## Next Steps

**Recommended Enhancements:**
1. **Video Library Page**: Create dedicated page for students to watch recorded videos
2. **Progress Tracking**: Track student completion percentage
3. **Certificates**: Auto-generate certificates on course completion
4. **Email Notifications**: Send emails for enrollments, class reminders
5. **Analytics**: Detailed charts for revenue, enrollments over time
6. **Bulk Upload**: CSV import for courses and students

---

Last Updated: March 28, 2026
