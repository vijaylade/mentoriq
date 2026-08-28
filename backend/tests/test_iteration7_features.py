"""
Iteration 7 Backend Tests - MentoriQ
Tests for bug fixes:
1. Admin Enrollments tab showing correct student names/emails (not 'Unknown')
2. YouTube playlist visibility based on enrollment status (frontend test)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@mentoriq.com"
ADMIN_PASSWORD = "Admin@123"
STUDENT_EMAIL = "student@test.com"
STUDENT_PASSWORD = "Test@123"
TEACHER_EMAIL = "teacher@mentoriq.com"
TEACHER_PASSWORD = "Teacher@123"

# Course with YouTube playlist
AGENTIC_AI_COURSE_ID = "0079725e-780a-4bf3-9a7c-4dd4dbeb3f82"


class TestAdminEnrollmentsStudentNames:
    """Test that admin enrollments show correct student names (not 'Unknown')"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    def test_admin_enrollments_no_unknown_names(self, admin_session):
        """Verify no enrollments have 'Unknown' as student_name"""
        response = admin_session.get(f"{BASE_URL}/api/admin/enrollments")
        assert response.status_code == 200
        enrollments = response.json()
        
        unknown_enrollments = [e for e in enrollments if e.get('student_name') == 'Unknown']
        assert len(unknown_enrollments) == 0, \
            f"Found {len(unknown_enrollments)} enrollments with 'Unknown' student_name: {unknown_enrollments}"
        
        print(f"All {len(enrollments)} enrollments have valid student names")
    
    def test_admin_enrollments_have_student_email(self, admin_session):
        """Verify all enrollments have student_email populated"""
        response = admin_session.get(f"{BASE_URL}/api/admin/enrollments")
        assert response.status_code == 200
        enrollments = response.json()
        
        missing_email = [e for e in enrollments if not e.get('student_email')]
        assert len(missing_email) == 0, \
            f"Found {len(missing_email)} enrollments with missing student_email"
        
        print(f"All {len(enrollments)} enrollments have valid student emails")
    
    def test_admin_enrollments_enrichment_fields(self, admin_session):
        """Verify enrollments have all enrichment fields"""
        response = admin_session.get(f"{BASE_URL}/api/admin/enrollments")
        assert response.status_code == 200
        enrollments = response.json()
        
        if len(enrollments) > 0:
            for enr in enrollments:
                assert 'student_name' in enr, f"Missing student_name in enrollment"
                assert 'student_email' in enr, f"Missing student_email in enrollment"
                assert 'course_title' in enr, f"Missing course_title in enrollment"
                assert enr['student_name'] != 'Unknown', f"student_name is 'Unknown' for {enr}"
                assert enr['student_name'] != 'Deleted User', f"student_name is 'Deleted User' for {enr}"
                print(f"  - {enr['student_name']} ({enr['student_email']}) -> {enr['course_title']}")


class TestEnrollmentCheckEndpoint:
    """Test enrollment check endpoint for YouTube visibility logic"""
    
    @pytest.fixture
    def student_session(self):
        """Get authenticated student session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD
        })
        assert response.status_code == 200, f"Student login failed: {response.text}"
        return session
    
    def test_enrolled_student_check_returns_true(self, student_session):
        """Verify enrolled student gets enrolled=true"""
        response = student_session.get(f"{BASE_URL}/api/enrollments/check/{AGENTIC_AI_COURSE_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data['enrolled'] == True, f"Expected enrolled=true, got {data}"
        print(f"Enrolled student check: {data}")
    
    def test_unauthenticated_check_returns_false(self):
        """Verify unauthenticated user gets enrolled=false"""
        response = requests.get(f"{BASE_URL}/api/enrollments/check/{AGENTIC_AI_COURSE_ID}")
        # Should return 401 or enrolled=false
        if response.status_code == 200:
            data = response.json()
            assert data['enrolled'] == False, f"Unauthenticated should not be enrolled: {data}"
        else:
            assert response.status_code == 401, f"Expected 401 for unauthenticated, got {response.status_code}"
        print(f"Unauthenticated check: status={response.status_code}")
    
    def test_non_enrolled_student_check_returns_false(self, student_session):
        """Verify student not enrolled in a course gets enrolled=false"""
        # Get all courses and find one the student is NOT enrolled in
        courses_response = requests.get(f"{BASE_URL}/api/courses")
        courses = courses_response.json()
        
        my_courses_response = student_session.get(f"{BASE_URL}/api/enrollments/my-courses")
        enrolled_ids = my_courses_response.json()
        
        non_enrolled_courses = [c for c in courses if c['id'] not in enrolled_ids]
        
        if len(non_enrolled_courses) > 0:
            course_id = non_enrolled_courses[0]['id']
            response = student_session.get(f"{BASE_URL}/api/enrollments/check/{course_id}")
            assert response.status_code == 200
            data = response.json()
            assert data['enrolled'] == False, f"Student should not be enrolled in {course_id}: {data}"
            print(f"Non-enrolled course check for {course_id}: {data}")
        else:
            pytest.skip("Student is enrolled in all courses, cannot test non-enrolled check")


class TestCourseYouTubePlaylist:
    """Test course YouTube playlist data"""
    
    def test_agentic_ai_course_has_youtube_playlist(self):
        """Verify Agentic AI course has YouTube playlist URL"""
        response = requests.get(f"{BASE_URL}/api/courses/{AGENTIC_AI_COURSE_ID}")
        assert response.status_code == 200
        course = response.json()
        
        assert 'youtube_playlist' in course, "Course missing youtube_playlist field"
        assert course['youtube_playlist'], "youtube_playlist is empty"
        assert 'list=' in course['youtube_playlist'], "youtube_playlist should contain list= parameter"
        print(f"Course YouTube playlist: {course['youtube_playlist']}")
    
    def test_course_detail_returns_all_fields(self):
        """Verify course detail returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/courses/{AGENTIC_AI_COURSE_ID}")
        assert response.status_code == 200
        course = response.json()
        
        required_fields = ['id', 'title', 'description', 'syllabus', 'pricing']
        for field in required_fields:
            assert field in course, f"Course missing required field: {field}"
        
        print(f"Course: {course['title']}")
        print(f"  - Has syllabus: {len(course.get('syllabus', []))} items")
        print(f"  - Has pricing: {course.get('pricing')}")


class TestAdminDashboardTabs:
    """Test all admin dashboard tabs load correctly"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_admin_overview_stats(self, admin_session):
        """Test admin overview stats endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        stats = response.json()
        assert 'total_users' in stats or 'users' in stats or isinstance(stats, dict)
        print(f"Admin stats: {stats}")
    
    def test_admin_courses_list(self, admin_session):
        """Test admin courses list"""
        response = admin_session.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        courses = response.json()
        assert len(courses) >= 3, f"Expected at least 3 courses, got {len(courses)}"
        print(f"Admin courses: {len(courses)} courses")
    
    def test_admin_enrollments_list(self, admin_session):
        """Test admin enrollments list"""
        response = admin_session.get(f"{BASE_URL}/api/admin/enrollments")
        assert response.status_code == 200
        enrollments = response.json()
        print(f"Admin enrollments: {len(enrollments)} enrollments")
    
    def test_admin_users_list(self, admin_session):
        """Test admin users list"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        assert len(users) >= 3, f"Expected at least 3 users, got {len(users)}"
        print(f"Admin users: {len(users)} users")
    
    def test_admin_testimonials_list(self, admin_session):
        """Test admin testimonials list"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        testimonials = response.json()
        print(f"Testimonials: {len(testimonials)} testimonials")
    
    def test_admin_blogs_list(self, admin_session):
        """Test admin blogs list"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        assert len(blogs) >= 6, f"Expected at least 6 blogs, got {len(blogs)}"
        print(f"Blogs: {len(blogs)} blogs")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
