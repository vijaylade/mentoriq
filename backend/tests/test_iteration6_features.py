"""
Iteration 6 Backend Tests - MentoriQ
Tests for:
1. Blog articles with real documentation links
2. Testimonial create/update with image persistence
3. Enrolled courses endpoint (my-courses)
4. Admin dropdowns (users, students, courses)
5. Enrollment check endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@mentoriq.com"
ADMIN_PASSWORD = "Admin@123"
TEST_STUDENT_EMAIL = "teststudent_iter6@test.com"
TEST_STUDENT_PASSWORD = "Test@123"


class TestBlogArticles:
    """Test blog articles with real documentation links"""
    
    def test_get_blogs_returns_6_articles(self):
        """Verify 6 blog articles are seeded"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        assert len(blogs) >= 6, f"Expected at least 6 blogs, got {len(blogs)}"
    
    def test_blogs_have_real_documentation_links(self):
        """Verify blogs have real AWS/Google/Salesforce documentation links"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        
        # Check for real documentation links
        real_domains = ['aws.amazon.com', 'salesforce.com', 'cloud.google.com', 'docs.aws.amazon.com']
        links_found = []
        
        for blog in blogs:
            link = blog.get('read_more_link', '')
            if link:
                links_found.append(link)
                # Verify it's a real documentation link
                assert any(domain in link for domain in real_domains), \
                    f"Blog '{blog['title']}' has link '{link}' which is not a real documentation URL"
        
        assert len(links_found) >= 5, f"Expected at least 5 blogs with read_more_link, found {len(links_found)}"
        print(f"Found {len(links_found)} blogs with real documentation links")
    
    def test_blog_categories_are_correct(self):
        """Verify blog categories match expected values"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        
        expected_categories = ['Fundamentals', 'Salesforce', 'AWS', 'Google Cloud', 'Applications', 'Technical']
        found_categories = set(blog['category'] for blog in blogs)
        
        for cat in expected_categories:
            assert cat in found_categories, f"Expected category '{cat}' not found in blogs"


class TestTestimonials:
    """Test testimonial create/update with image persistence"""
    
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
    
    def test_get_testimonials(self):
        """Verify testimonials endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        testimonials = response.json()
        assert len(testimonials) >= 2, f"Expected at least 2 testimonials, got {len(testimonials)}"
    
    def test_testimonials_have_image_urls(self):
        """Verify testimonials have image_url field"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        testimonials = response.json()
        
        for t in testimonials:
            assert 'image_url' in t, f"Testimonial '{t['name']}' missing image_url"
            assert t['image_url'], f"Testimonial '{t['name']}' has empty image_url"
    
    def test_create_testimonial_preserves_image_url(self, admin_session):
        """Test creating testimonial with image_url"""
        test_image_url = "https://example.com/test-image.jpg"
        payload = {
            "name": "TEST_Iter6_User",
            "role": "Test Role",
            "content": "Test content for iteration 6",
            "image_url": test_image_url,
            "rating": 5
        }
        
        response = admin_session.post(f"{BASE_URL}/api/admin/testimonials", json=payload)
        assert response.status_code == 200, f"Create testimonial failed: {response.text}"
        data = response.json()
        assert 'id' in data
        
        # Verify by fetching all testimonials
        get_response = requests.get(f"{BASE_URL}/api/testimonials")
        testimonials = get_response.json()
        created = next((t for t in testimonials if t['name'] == "TEST_Iter6_User"), None)
        assert created is not None, "Created testimonial not found"
        assert created['image_url'] == test_image_url, f"Image URL not preserved: {created['image_url']}"
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/testimonials/{data['id']}")
    
    def test_update_testimonial_preserves_image_url(self, admin_session):
        """Test updating testimonial preserves image_url"""
        # Create a testimonial first
        test_image_url = "https://example.com/original-image.jpg"
        create_payload = {
            "name": "TEST_Update_User",
            "role": "Original Role",
            "content": "Original content",
            "image_url": test_image_url,
            "rating": 4
        }
        
        create_response = admin_session.post(f"{BASE_URL}/api/admin/testimonials", json=create_payload)
        assert create_response.status_code == 200
        testimonial_id = create_response.json()['id']
        
        # Update only the content, keeping image_url
        update_payload = {
            "name": "TEST_Update_User",
            "role": "Updated Role",
            "content": "Updated content",
            "image_url": test_image_url,  # Same image URL
            "rating": 5
        }
        
        update_response = admin_session.put(
            f"{BASE_URL}/api/admin/testimonials/{testimonial_id}",
            json=update_payload
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify image_url is preserved
        get_response = requests.get(f"{BASE_URL}/api/testimonials")
        testimonials = get_response.json()
        updated = next((t for t in testimonials if t['id'] == testimonial_id), None)
        assert updated is not None, "Updated testimonial not found"
        assert updated['image_url'] == test_image_url, f"Image URL changed after update: {updated['image_url']}"
        assert updated['role'] == "Updated Role", "Role not updated"
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/testimonials/{testimonial_id}")


class TestEnrollmentFeatures:
    """Test enrollment-related features"""
    
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
    
    @pytest.fixture
    def student_session(self, admin_session):
        """Create and login as test student"""
        # Try to create student (may already exist)
        session = requests.Session()
        register_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_STUDENT_EMAIL,
            "password": TEST_STUDENT_PASSWORD,
            "name": "Test Student Iter6",
            "role": "student"
        })
        
        if register_response.status_code == 400:  # Already exists
            login_response = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_STUDENT_EMAIL,
                "password": TEST_STUDENT_PASSWORD
            })
            assert login_response.status_code == 200, f"Student login failed: {login_response.text}"
        
        return session
    
    def test_my_courses_endpoint_returns_enrolled_course_ids(self, admin_session, student_session):
        """Test GET /api/enrollments/my-courses returns list of course_ids"""
        # Get student ID
        me_response = student_session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        student_id = me_response.json()['id']
        
        # Get a course to enroll in
        courses_response = requests.get(f"{BASE_URL}/api/courses")
        courses = courses_response.json()
        assert len(courses) > 0
        course_id = courses[0]['id']
        
        # Enroll student via admin
        enroll_response = admin_session.post(f"{BASE_URL}/api/admin/enroll", json={
            "user_id": student_id,
            "course_id": course_id,
            "enrollment_type": "recorded"
        })
        # May fail if already enrolled, that's OK
        
        # Test my-courses endpoint
        my_courses_response = student_session.get(f"{BASE_URL}/api/enrollments/my-courses")
        assert my_courses_response.status_code == 200
        enrolled_ids = my_courses_response.json()
        assert isinstance(enrolled_ids, list), "my-courses should return a list"
        assert course_id in enrolled_ids, f"Enrolled course {course_id} not in my-courses response"
    
    def test_enrollment_check_endpoint(self, student_session):
        """Test GET /api/enrollments/check/{course_id}"""
        # Get courses
        courses_response = requests.get(f"{BASE_URL}/api/courses")
        courses = courses_response.json()
        
        # Check enrollment for first course (should be enrolled from previous test)
        course_id = courses[0]['id']
        check_response = student_session.get(f"{BASE_URL}/api/enrollments/check/{course_id}")
        assert check_response.status_code == 200
        data = check_response.json()
        assert 'enrolled' in data
        assert isinstance(data['enrolled'], bool)


class TestAdminDropdowns:
    """Test admin dropdown data sources"""
    
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
    
    def test_admin_users_returns_all_users(self, admin_session):
        """Verify GET /api/admin/users returns users from DB"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        assert len(users) >= 3, f"Expected at least 3 users (admin, teacher, student), got {len(users)}"
        
        # Verify user structure
        for user in users:
            assert 'id' in user
            assert 'email' in user
            assert 'name' in user
            assert 'role' in user
            assert 'password_hash' not in user, "password_hash should not be exposed"
    
    def test_admin_users_includes_students(self, admin_session):
        """Verify users list includes students for enrollment dropdown"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        
        students = [u for u in users if u['role'] == 'student']
        assert len(students) >= 1, "Expected at least 1 student in users list"
    
    def test_courses_endpoint_for_dropdown(self):
        """Verify GET /api/courses returns courses for dropdown"""
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        courses = response.json()
        assert len(courses) >= 3, f"Expected at least 3 courses, got {len(courses)}"
        
        # Verify course structure for dropdown
        for course in courses:
            assert 'id' in course
            assert 'title' in course
            assert 'course_type' in course or 'pricing' in course
    
    def test_admin_enrollments_returns_enriched_data(self, admin_session):
        """Verify GET /api/admin/enrollments returns student_name and course_title"""
        response = admin_session.get(f"{BASE_URL}/api/admin/enrollments")
        assert response.status_code == 200
        enrollments = response.json()
        
        if len(enrollments) > 0:
            enr = enrollments[0]
            assert 'student_name' in enr, "Enrollment missing student_name"
            assert 'course_title' in enr, "Enrollment missing course_title"
            assert 'student_email' in enr, "Enrollment missing student_email"


class TestCourseInstructorDropdown:
    """Test instructor dropdown for courses"""
    
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
    
    def test_users_includes_teachers(self, admin_session):
        """Verify users list includes teachers for instructor dropdown"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        
        teachers = [u for u in users if u['role'] == 'teacher']
        assert len(teachers) >= 1, "Expected at least 1 teacher in users list"
        
        # Verify teacher has required fields
        for teacher in teachers:
            assert 'name' in teacher
            assert 'email' in teacher


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
