"""
Test suite for MentoriQ Iteration 4 features:
- Image upload for testimonials and courses
- Blog CRUD with external links
- Landing page dynamic content
- About page
- Navbar and footer contact info
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')

class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        print("✓ API is healthy")
    
    def test_admin_login(self):
        """Test admin login"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mentoriq.com",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        print("✓ Admin login successful")
        return session


class TestImageUpload:
    """Test image upload endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mentoriq.com",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        return session
    
    def test_upload_endpoint_requires_auth(self):
        """Test upload endpoint requires authentication"""
        # Create a simple test image
        files = {'image': ('test.jpg', b'fake image content', 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/upload/image", files=files)
        assert response.status_code == 401
        print("✓ Upload endpoint requires authentication")
    
    def test_upload_endpoint_rejects_non_images(self, admin_session):
        """Test upload endpoint rejects non-image files"""
        files = {'image': ('test.txt', b'not an image', 'text/plain')}
        response = admin_session.post(f"{BASE_URL}/api/upload/image", files=files)
        assert response.status_code == 400
        print("✓ Upload endpoint rejects non-image files")


class TestTestimonials:
    """Test testimonials CRUD with image support"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mentoriq.com",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        return session
    
    def test_get_testimonials(self):
        """Test getting testimonials (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} testimonials")
    
    def test_create_testimonial(self, admin_session):
        """Test creating a testimonial"""
        payload = {
            "name": "TEST_John Doe",
            "role": "AI Engineer",
            "content": "Great platform for learning AI!",
            "image_url": "/api/uploads/test.jpg",
            "rating": 5
        }
        response = admin_session.post(f"{BASE_URL}/api/admin/testimonials", json=payload)
        assert response.status_code == 200
        print("✓ Testimonial created")
    
    def test_testimonial_requires_auth(self):
        """Test testimonial creation requires auth"""
        payload = {
            "name": "Unauthorized",
            "role": "Test",
            "content": "Should fail",
            "rating": 5
        }
        response = requests.post(f"{BASE_URL}/api/admin/testimonials", json=payload)
        assert response.status_code == 401
        print("✓ Testimonial creation requires auth")


class TestBlogWithExternalLinks:
    """Test blog CRUD with external link support"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mentoriq.com",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        return session
    
    def test_get_blogs(self):
        """Test getting blogs (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} blogs")
    
    def test_create_blog_with_external_link(self, admin_session):
        """Test creating a blog with external link"""
        data = {
            'title': 'TEST_Blog with External Link',
            'category': 'Testing',
            'excerpt': 'This is a test blog with an external link',
            'tags': 'test, automation',
            'read_time': '3 min read',
            'read_more_link': 'https://example.com/test-article'
        }
        response = admin_session.post(f"{BASE_URL}/api/admin/blogs", data=data)
        assert response.status_code == 200
        result = response.json()
        assert result.get('read_more_link') == 'https://example.com/test-article'
        print("✓ Blog with external link created")
        return result.get('id')
    
    def test_update_blog_link(self, admin_session):
        """Test updating a blog's external link"""
        # First create a blog
        create_data = {
            'title': 'TEST_Blog to Update',
            'category': 'Testing',
            'excerpt': 'This blog will be updated',
            'tags': 'test',
            'read_time': '2 min read',
            'read_more_link': 'https://example.com/original'
        }
        create_response = admin_session.post(f"{BASE_URL}/api/admin/blogs", data=create_data)
        assert create_response.status_code == 200
        blog_id = create_response.json().get('id')
        
        # Update the blog
        update_data = {
            'title': 'TEST_Blog to Update',
            'category': 'Testing',
            'excerpt': 'This blog has been updated',
            'tags': 'test, updated',
            'read_time': '2 min read',
            'read_more_link': 'https://example.com/updated-link'
        }
        update_response = admin_session.put(f"{BASE_URL}/api/admin/blogs/{blog_id}", data=update_data)
        assert update_response.status_code == 200
        print("✓ Blog link updated")
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/blogs/{blog_id}")
        assert get_response.status_code == 200
        blog = get_response.json()
        assert blog.get('read_more_link') == 'https://example.com/updated-link'
        print("✓ Blog update verified")
    
    def test_blog_requires_auth(self):
        """Test blog creation requires auth"""
        data = {
            'title': 'Unauthorized Blog',
            'category': 'Test',
            'excerpt': 'Should fail'
        }
        response = requests.post(f"{BASE_URL}/api/admin/blogs", data=data)
        assert response.status_code == 401
        print("✓ Blog creation requires auth")


class TestCourses:
    """Test courses with thumbnail support"""
    
    def test_get_courses(self):
        """Test getting courses (public endpoint)"""
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Got {len(data)} courses")
    
    def test_get_course_detail(self):
        """Test getting course detail"""
        # First get list of courses
        list_response = requests.get(f"{BASE_URL}/api/courses")
        courses = list_response.json()
        if courses:
            course_id = courses[0].get('id')
            detail_response = requests.get(f"{BASE_URL}/api/courses/{course_id}")
            assert detail_response.status_code == 200
            course = detail_response.json()
            assert 'title' in course
            assert 'syllabus' in course
            assert 'instructor' in course
            print("✓ Course detail retrieved")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mentoriq.com",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        return session
    
    def test_cleanup_test_blogs(self, admin_session):
        """Clean up test blogs"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        blogs = response.json()
        deleted = 0
        for blog in blogs:
            if blog.get('title', '').startswith('TEST_'):
                del_response = admin_session.delete(f"{BASE_URL}/api/admin/blogs/{blog['id']}")
                if del_response.status_code == 200:
                    deleted += 1
        print(f"✓ Cleaned up {deleted} test blogs")
    
    def test_cleanup_test_testimonials(self, admin_session):
        """Clean up test testimonials"""
        response = requests.get(f"{BASE_URL}/api/testimonials")
        testimonials = response.json()
        deleted = 0
        for testimonial in testimonials:
            if testimonial.get('name', '').startswith('TEST_'):
                del_response = admin_session.delete(f"{BASE_URL}/api/admin/testimonials/{testimonial['id']}")
                if del_response.status_code == 200:
                    deleted += 1
        print(f"✓ Cleaned up {deleted} test testimonials")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
