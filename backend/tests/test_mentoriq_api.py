"""
MentoriQ API Tests - Testing Course Detail, Blog CRUD, and Core Features
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://127.0.0.1:8000')

# Test credentials
ADMIN_EMAIL = "admin@mentoriq.com"
ADMIN_PASSWORD = "Admin@123"
TEACHER_EMAIL = "teacher@mentoriq.com"
TEACHER_PASSWORD = "Teacher@123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_session():
    """Admin authenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Admin authentication failed")
    return session


@pytest.fixture(scope="module")
def teacher_session():
    """Teacher authenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEACHER_EMAIL,
        "password": TEACHER_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Teacher authentication failed")
    return session


# ============ AUTH TESTS ============
class TestAuth:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self, api_client):
        """Test admin login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert "id" in data
        print(f"✓ Admin login successful: {data['email']}")
    
    def test_teacher_login_success(self, api_client):
        """Test teacher login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["email"] == TEACHER_EMAIL
        assert data["role"] == "teacher"
        print(f"✓ Teacher login successful: {data['email']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected correctly")


# ============ COURSE TESTS ============
class TestCourses:
    """Course listing and detail tests"""
    
    def test_get_courses_list(self, api_client):
        """Test fetching all courses"""
        response = api_client.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        courses = response.json()
        assert isinstance(courses, list)
        assert len(courses) > 0, "Expected at least one course"
        print(f"✓ Found {len(courses)} courses")
        
        # Verify course structure
        for course in courses:
            assert "id" in course
            assert "title" in course
            assert "pricing" in course
            # Verify course_type is present (either from DB or computed)
            assert "course_type" in course, f"course_type missing for course {course['id']}"
            assert course["course_type"] in ["live", "recorded"], f"Invalid course_type: {course['course_type']}"
        print("✓ All courses have required fields including course_type")
    
    def test_get_course_detail(self, api_client):
        """Test fetching single course details"""
        # First get list to get a valid course ID
        list_response = api_client.get(f"{BASE_URL}/api/courses")
        courses = list_response.json()
        assert len(courses) > 0, "No courses available"
        
        course_id = courses[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/courses/{course_id}")
        assert response.status_code == 200
        
        course = response.json()
        assert course["id"] == course_id
        assert "title" in course
        assert "description" in course
        assert "pricing" in course
        assert "syllabus" in course
        assert "instructor" in course
        assert "course_type" in course
        print(f"✓ Course detail loaded: {course['title']}")
        print(f"  - course_type: {course['course_type']}")
        print(f"  - pricing: {course['pricing']}")
    
    def test_course_not_found(self, api_client):
        """Test 404 for non-existent course"""
        response = api_client.get(f"{BASE_URL}/api/courses/non-existent-id")
        assert response.status_code == 404
        print("✓ Non-existent course returns 404")
    
    def test_course_pricing_and_type_consistency(self, api_client):
        """Verify course_type matches pricing structure"""
        response = api_client.get(f"{BASE_URL}/api/courses")
        courses = response.json()
        
        for course in courses:
            course_type = course.get("course_type")
            pricing = course.get("pricing", {})
            
            if course_type == "live":
                assert "live" in pricing or "recorded" in pricing, f"Live course {course['id']} has no pricing"
            elif course_type == "recorded":
                assert "recorded" in pricing or "live" in pricing, f"Recorded course {course['id']} has no pricing"
            
            print(f"✓ Course '{course['title']}' - type: {course_type}, pricing: {pricing}")


# ============ BLOG TESTS ============
class TestBlogs:
    """Blog CRUD tests"""
    
    def test_get_blogs_list(self, api_client):
        """Test fetching all blogs (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        assert isinstance(blogs, list)
        print(f"✓ Blogs endpoint working, found {len(blogs)} blogs")
    
    def test_create_blog_without_auth(self, api_client):
        """Test that creating blog requires authentication"""
        # Using multipart form data - need to remove JSON content-type
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/admin/blogs",
            data={
                "title": "Test Blog",
                "category": "Test",
                "excerpt": "Test excerpt",
                "tags": "test,api",
                "read_time": "5 min read"
            }
        )
        # 401 or 403 both indicate auth required
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Blog creation requires authentication")
    
    def test_create_blog_as_admin(self, admin_session):
        """Test creating a blog as admin"""
        unique_title = f"TEST_Blog_{uuid.uuid4().hex[:8]}"
        
        # Need to use a fresh session for multipart form data
        # First login to get cookies
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, "Admin login failed"
        
        # Now create blog with form data (no Content-Type header for multipart)
        response = session.post(
            f"{BASE_URL}/api/admin/blogs",
            data={
                "title": unique_title,
                "category": "Testing",
                "excerpt": "This is a test blog created by automated tests",
                "tags": "test,automation,api",
                "read_time": "3 min read"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        blog = response.json()
        assert blog["title"] == unique_title
        assert blog["category"] == "Testing"
        assert "id" in blog
        assert blog["tags"] == ["test", "automation", "api"]
        print(f"✓ Blog created successfully: {blog['id']}")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/admin/blogs/{blog['id']}")
        
        return blog["id"]
    
    def test_get_blog_detail(self, api_client):
        """Test fetching single blog detail"""
        # First create a blog with proper session
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, "Admin login failed"
        
        unique_title = f"TEST_BlogDetail_{uuid.uuid4().hex[:8]}"
        create_response = session.post(
            f"{BASE_URL}/api/admin/blogs",
            data={
                "title": unique_title,
                "category": "Detail Test",
                "excerpt": "Testing blog detail endpoint",
                "tags": "detail,test",
                "read_time": "2 min read"
            }
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        blog_id = create_response.json()["id"]
        
        # Now fetch the detail
        response = api_client.get(f"{BASE_URL}/api/blogs/{blog_id}")
        assert response.status_code == 200
        
        blog = response.json()
        assert blog["id"] == blog_id
        assert blog["title"] == unique_title
        print(f"✓ Blog detail fetched: {blog['title']}")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/admin/blogs/{blog_id}")
    
    def test_update_blog(self):
        """Test updating a blog"""
        # Create session and login
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, "Admin login failed"
        
        # Create a blog first
        unique_title = f"TEST_BlogUpdate_{uuid.uuid4().hex[:8]}"
        create_response = session.post(
            f"{BASE_URL}/api/admin/blogs",
            data={
                "title": unique_title,
                "category": "Update Test",
                "excerpt": "Original excerpt",
                "tags": "original",
                "read_time": "5 min read"
            }
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        blog_id = create_response.json()["id"]
        
        # Update the blog
        updated_title = f"TEST_Updated_{uuid.uuid4().hex[:8]}"
        update_response = session.put(
            f"{BASE_URL}/api/admin/blogs/{blog_id}",
            data={
                "title": updated_title,
                "category": "Updated Category",
                "excerpt": "Updated excerpt content",
                "tags": "updated,modified",
                "read_time": "7 min read"
            }
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        print(f"✓ Blog updated successfully")
        
        # Verify update
        get_response = session.get(f"{BASE_URL}/api/blogs/{blog_id}")
        assert get_response.status_code == 200
        updated_blog = get_response.json()
        assert updated_blog["title"] == updated_title
        assert updated_blog["category"] == "Updated Category"
        print(f"✓ Blog update verified: {updated_blog['title']}")
        
        # Cleanup
        session.delete(f"{BASE_URL}/api/admin/blogs/{blog_id}")
    
    def test_delete_blog(self):
        """Test deleting a blog"""
        # Create session and login
        session = requests.Session()
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, "Admin login failed"
        
        # Create a blog first
        unique_title = f"TEST_BlogDelete_{uuid.uuid4().hex[:8]}"
        create_response = session.post(
            f"{BASE_URL}/api/admin/blogs",
            data={
                "title": unique_title,
                "category": "Delete Test",
                "excerpt": "This blog will be deleted",
                "tags": "delete,test",
                "read_time": "1 min read"
            }
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        blog_id = create_response.json()["id"]
        
        # Delete the blog
        delete_response = session.delete(f"{BASE_URL}/api/admin/blogs/{blog_id}")
        assert delete_response.status_code == 200
        print(f"✓ Blog deleted successfully")
        
        # Verify deletion
        get_response = session.get(f"{BASE_URL}/api/blogs/{blog_id}")
        assert get_response.status_code == 404
        print("✓ Deleted blog returns 404")


# ============ ADMIN STATS TESTS ============
class TestAdminStats:
    """Admin dashboard stats tests"""
    
    def test_admin_stats_requires_auth(self, api_client):
        """Test that admin stats requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/admin/stats")
        # 401 or 403 both indicate auth required
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Admin stats requires authentication")
    
    def test_admin_stats_success(self, admin_session):
        """Test fetching admin stats"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        
        stats = response.json()
        assert "total_users" in stats
        assert "total_courses" in stats
        assert "total_enrollments" in stats
        assert "total_revenue" in stats
        print(f"✓ Admin stats: users={stats['total_users']}, courses={stats['total_courses']}")
    
    def test_admin_users_list(self, admin_session):
        """Test fetching users list as admin"""
        response = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0
        
        # Verify user structure
        for user in users:
            assert "id" in user
            assert "email" in user
            assert "role" in user
            assert "password_hash" not in user  # Should not expose password
        print(f"✓ Admin users list: {len(users)} users")


# ============ TESTIMONIALS TESTS ============
class TestTestimonials:
    """Testimonials tests"""
    
    def test_get_testimonials(self, api_client):
        """Test fetching testimonials (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        testimonials = response.json()
        assert isinstance(testimonials, list)
        print(f"✓ Testimonials endpoint working, found {len(testimonials)} testimonials")


# ============ CLEANUP ============
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_blogs(admin_session):
    """Cleanup TEST_ prefixed blogs after all tests"""
    yield
    # Cleanup
    try:
        response = admin_session.get(f"{BASE_URL}/api/blogs")
        if response.status_code == 200:
            blogs = response.json()
            for blog in blogs:
                if blog.get("title", "").startswith("TEST_"):
                    admin_session.delete(f"{BASE_URL}/api/admin/blogs/{blog['id']}")
                    print(f"Cleaned up test blog: {blog['title']}")
    except Exception as e:
        print(f"Cleanup error: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
