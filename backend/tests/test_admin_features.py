"""
Test suite for MentoriQ Admin Features - Iteration 3
Tests: Admin user management, purchases, blog CRUD with URL links
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')

class TestAdminAuth:
    """Admin authentication tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.admin_email = "admin@mentoriq.com"
        self.admin_password = "Admin@123"
    
    def test_admin_login(self):
        """Test admin login returns correct user data"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == self.admin_email
        assert data["role"] == "admin"
        print(f"PASS: Admin login successful - {data['name']}")


class TestAdminUserManagement:
    """Admin user CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login as admin
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mentoriq.com",
            "password": "Admin@123"
        })
        self.created_user_id = None
    
    def test_get_all_users(self):
        """Test admin can get all users"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0
        # Verify user structure
        user = users[0]
        assert "id" in user
        assert "email" in user
        assert "name" in user
        assert "role" in user
        print(f"PASS: Got {len(users)} users")
    
    def test_create_user(self):
        """Test admin can create a new user"""
        test_email = "test_admin_create@test.com"
        response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "email": test_email,
            "password": "TestPass123",
            "name": "Test Admin Create",
            "role": "teacher"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_email
        assert data["role"] == "teacher"
        assert "id" in data
        self.created_user_id = data["id"]
        print(f"PASS: Created user with ID {data['id']}")
        
        # Cleanup - delete the created user
        if self.created_user_id:
            self.session.delete(f"{BASE_URL}/api/admin/users/{self.created_user_id}")
    
    def test_create_user_duplicate_email(self):
        """Test creating user with duplicate email fails"""
        response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "email": "admin@mentoriq.com",  # Already exists
            "password": "TestPass123",
            "name": "Duplicate Admin",
            "role": "student"
        })
        assert response.status_code == 400
        print("PASS: Duplicate email rejected")
    
    def test_delete_user(self):
        """Test admin can delete a user"""
        # First create a user to delete
        create_response = self.session.post(f"{BASE_URL}/api/admin/users", json={
            "email": "test_delete_user@test.com",
            "password": "TestPass123",
            "name": "Test Delete User",
            "role": "student"
        })
        assert create_response.status_code == 200
        user_id = create_response.json()["id"]
        
        # Delete the user
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["message"] == "User deleted"
        print(f"PASS: Deleted user {user_id}")
        
        # Verify user is deleted by trying to get users
        users_response = self.session.get(f"{BASE_URL}/api/admin/users")
        users = users_response.json()
        user_ids = [u["id"] for u in users]
        assert user_id not in user_ids
        print("PASS: User no longer in list")


class TestAdminPurchases:
    """Admin purchases endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login as admin
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mentoriq.com",
            "password": "Admin@123"
        })
    
    def test_get_purchases(self):
        """Test admin can get purchase history"""
        response = self.session.get(f"{BASE_URL}/api/admin/purchases")
        assert response.status_code == 200
        purchases = response.json()
        assert isinstance(purchases, list)
        print(f"PASS: Got {len(purchases)} purchases")
    
    def test_get_stats(self):
        """Test admin can get platform stats"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        stats = response.json()
        assert "total_users" in stats
        assert "total_courses" in stats
        assert "total_enrollments" in stats
        assert "total_revenue" in stats
        print(f"PASS: Stats - Users: {stats['total_users']}, Courses: {stats['total_courses']}, Revenue: {stats['total_revenue']}")


class TestAdminBlogManagement:
    """Admin blog CRUD tests with URL link support"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login as admin
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mentoriq.com",
            "password": "Admin@123"
        })
        self.created_blog_id = None
    
    def test_get_blogs(self):
        """Test getting all blogs"""
        response = self.session.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        assert isinstance(blogs, list)
        print(f"PASS: Got {len(blogs)} blogs")
    
    def test_create_blog_with_url_link(self):
        """Test creating blog with read_more_link URL"""
        response = self.session.post(f"{BASE_URL}/api/admin/blogs", data={
            "title": "Test Blog with URL",
            "category": "Testing",
            "excerpt": "This is a test blog with URL link",
            "tags": "test,url",
            "read_time": "3 min read",
            "read_more_link": "https://example.com/test"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Blog with URL"
        assert data["read_more_link"] == "https://example.com/test"
        assert "id" in data
        self.created_blog_id = data["id"]
        print(f"PASS: Created blog with URL link - ID: {data['id']}")
        
        # Verify blog appears in list
        blogs_response = self.session.get(f"{BASE_URL}/api/blogs")
        blogs = blogs_response.json()
        blog_ids = [b["id"] for b in blogs]
        assert self.created_blog_id in blog_ids
        print("PASS: Blog appears in list")
        
        # Cleanup
        if self.created_blog_id:
            self.session.delete(f"{BASE_URL}/api/admin/blogs/{self.created_blog_id}")
    
    def test_update_blog(self):
        """Test updating a blog"""
        # First create a blog
        create_response = self.session.post(f"{BASE_URL}/api/admin/blogs", data={
            "title": "Blog to Update",
            "category": "Testing",
            "excerpt": "Original excerpt",
            "tags": "test",
            "read_time": "2 min read",
            "read_more_link": ""
        })
        assert create_response.status_code == 200
        blog_id = create_response.json()["id"]
        
        # Update the blog
        update_response = self.session.put(f"{BASE_URL}/api/admin/blogs/{blog_id}", data={
            "title": "Updated Blog Title",
            "category": "Updated",
            "excerpt": "Updated excerpt",
            "tags": "updated,test",
            "read_time": "5 min read",
            "read_more_link": "https://example.com/updated"
        })
        assert update_response.status_code == 200
        print(f"PASS: Updated blog {blog_id}")
        
        # Verify update
        get_response = self.session.get(f"{BASE_URL}/api/blogs/{blog_id}")
        assert get_response.status_code == 200
        blog = get_response.json()
        assert blog["title"] == "Updated Blog Title"
        assert blog["read_more_link"] == "https://example.com/updated"
        print("PASS: Blog update verified")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/blogs/{blog_id}")
    
    def test_delete_blog(self):
        """Test deleting a blog"""
        # First create a blog
        create_response = self.session.post(f"{BASE_URL}/api/admin/blogs", data={
            "title": "Blog to Delete",
            "category": "Testing",
            "excerpt": "This will be deleted",
            "tags": "delete",
            "read_time": "1 min read",
            "read_more_link": ""
        })
        assert create_response.status_code == 200
        blog_id = create_response.json()["id"]
        
        # Delete the blog
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/blogs/{blog_id}")
        assert delete_response.status_code == 200
        print(f"PASS: Deleted blog {blog_id}")
        
        # Verify deletion
        get_response = self.session.get(f"{BASE_URL}/api/blogs/{blog_id}")
        assert get_response.status_code == 404
        print("PASS: Blog deletion verified")


class TestPublicEndpoints:
    """Test public endpoints without auth"""
    
    def test_get_courses(self):
        """Test getting courses without auth"""
        response = requests.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        courses = response.json()
        assert isinstance(courses, list)
        assert len(courses) > 0
        print(f"PASS: Got {len(courses)} courses")
    
    def test_get_blogs_public(self):
        """Test getting blogs without auth"""
        response = requests.get(f"{BASE_URL}/api/blogs")
        assert response.status_code == 200
        blogs = response.json()
        assert isinstance(blogs, list)
        print(f"PASS: Got {len(blogs)} blogs (public)")


class TestUnauthorizedAccess:
    """Test that admin endpoints require auth"""
    
    def test_admin_users_requires_auth(self):
        """Test admin/users requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401
        print("PASS: Admin users endpoint requires auth")
    
    def test_admin_purchases_requires_auth(self):
        """Test admin/purchases requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/purchases")
        assert response.status_code == 401
        print("PASS: Admin purchases endpoint requires auth")
    
    def test_admin_stats_requires_auth(self):
        """Test admin/stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
        print("PASS: Admin stats endpoint requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
