"""
Iteration 8 - Google Drive Video Integration Tests
Tests for:
1. GET /api/courses should NOT contain youtube_playlist or drive_videos fields
2. GET /api/courses/{id} should NOT contain youtube_playlist or drive_videos fields, but SHOULD have has_videos boolean
3. GET /api/courses/{id}/videos should return 403 for unauthenticated users
4. GET /api/courses/{id}/videos should return 403 for non-enrolled students
5. GET /api/courses/{id}/videos should return drive_videos array with embed_urls for enrolled students
6. Admin can add drive_videos via PUT /api/courses/{id}
7. Teacher can access videos endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')
COURSE_ID = "0079725e-780a-4bf3-9a7c-4dd4dbeb3f82"  # Mastering Agentic AI Systems

# Test credentials
ADMIN_EMAIL = "admin@mentoriq.com"
ADMIN_PASSWORD = "Admin@123"
TEACHER_EMAIL = "teacher@mentoriq.com"
TEACHER_PASSWORD = "Teacher@123"
STUDENT_EMAIL = "student@test.com"
STUDENT_PASSWORD = "Test@123"


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
        pytest.skip("Admin login failed")
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
        pytest.skip("Teacher login failed")
    return session


@pytest.fixture(scope="module")
def enrolled_student_session():
    """Enrolled student authenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": STUDENT_EMAIL,
        "password": STUDENT_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip("Student login failed")
    return session


@pytest.fixture(scope="module")
def non_enrolled_session():
    """Non-enrolled user authenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    # Try to register or login
    import uuid
    email = f"test_nonenrolled_{uuid.uuid4().hex[:8]}@test.com"
    response = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": "Test@123",
        "name": "Non Enrolled Test User"
    })
    if response.status_code not in [200, 400]:  # 400 if already exists
        pytest.skip("Non-enrolled user registration failed")
    return session


class TestCoursesListEndpoint:
    """Tests for GET /api/courses - should NOT expose video fields"""
    
    def test_courses_list_no_youtube_playlist(self, api_client):
        """GET /api/courses should NOT contain youtube_playlist field"""
        response = api_client.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        
        courses = response.json()
        assert isinstance(courses, list)
        
        for course in courses:
            assert "youtube_playlist" not in course, f"Course {course.get('id')} exposes youtube_playlist"
    
    def test_courses_list_no_drive_videos(self, api_client):
        """GET /api/courses should NOT contain drive_videos field"""
        response = api_client.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200
        
        courses = response.json()
        for course in courses:
            assert "drive_videos" not in course, f"Course {course.get('id')} exposes drive_videos"


class TestCourseDetailEndpoint:
    """Tests for GET /api/courses/{id} - should NOT expose video fields but SHOULD have has_videos"""
    
    def test_course_detail_no_youtube_playlist(self, api_client):
        """GET /api/courses/{id} should NOT contain youtube_playlist field"""
        response = api_client.get(f"{BASE_URL}/api/courses/{COURSE_ID}")
        assert response.status_code == 200
        
        course = response.json()
        assert "youtube_playlist" not in course, "Course detail exposes youtube_playlist"
    
    def test_course_detail_no_drive_videos(self, api_client):
        """GET /api/courses/{id} should NOT contain drive_videos field"""
        response = api_client.get(f"{BASE_URL}/api/courses/{COURSE_ID}")
        assert response.status_code == 200
        
        course = response.json()
        assert "drive_videos" not in course, "Course detail exposes drive_videos"
    
    def test_course_detail_has_videos_boolean(self, api_client):
        """GET /api/courses/{id} SHOULD have has_videos boolean"""
        response = api_client.get(f"{BASE_URL}/api/courses/{COURSE_ID}")
        assert response.status_code == 200
        
        course = response.json()
        assert "has_videos" in course, "Course detail missing has_videos field"
        assert isinstance(course["has_videos"], bool), "has_videos should be boolean"
        assert course["has_videos"] is True, "Course should have videos"


class TestVideosEndpointAuth:
    """Tests for GET /api/courses/{id}/videos - authentication and authorization"""
    
    def test_videos_unauthenticated_returns_401(self, api_client):
        """GET /api/courses/{id}/videos should return 401 for unauthenticated users"""
        response = api_client.get(f"{BASE_URL}/api/courses/{COURSE_ID}/videos")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_videos_non_enrolled_returns_403(self, non_enrolled_session):
        """GET /api/courses/{id}/videos should return 403 for non-enrolled students"""
        response = non_enrolled_session.get(f"{BASE_URL}/api/courses/{COURSE_ID}/videos")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        
        data = response.json()
        assert "Not enrolled" in data.get("detail", ""), "Should indicate not enrolled"


class TestVideosEndpointAccess:
    """Tests for GET /api/courses/{id}/videos - authorized access"""
    
    def test_enrolled_student_can_access_videos(self, enrolled_student_session):
        """GET /api/courses/{id}/videos should return drive_videos for enrolled students"""
        response = enrolled_student_session.get(f"{BASE_URL}/api/courses/{COURSE_ID}/videos")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "drive_videos" in data, "Response should contain drive_videos"
        assert isinstance(data["drive_videos"], list), "drive_videos should be a list"
    
    def test_enrolled_student_videos_have_embed_urls(self, enrolled_student_session):
        """Videos should have embed_url in correct format"""
        response = enrolled_student_session.get(f"{BASE_URL}/api/courses/{COURSE_ID}/videos")
        assert response.status_code == 200
        
        data = response.json()
        drive_videos = data.get("drive_videos", [])
        
        for video in drive_videos:
            assert "title" in video, "Video should have title"
            assert "embed_url" in video, "Video should have embed_url"
            if video["embed_url"]:
                assert "drive.google.com/file/d/" in video["embed_url"], "embed_url should be Google Drive format"
                assert "/preview" in video["embed_url"], "embed_url should end with /preview"
    
    def test_admin_can_access_videos(self, admin_session):
        """Admin should be able to access videos endpoint"""
        response = admin_session.get(f"{BASE_URL}/api/courses/{COURSE_ID}/videos")
        assert response.status_code == 200, f"Admin should access videos, got {response.status_code}"
        
        data = response.json()
        assert "drive_videos" in data
    
    def test_teacher_can_access_videos(self, teacher_session):
        """Teacher should be able to access videos endpoint"""
        response = teacher_session.get(f"{BASE_URL}/api/courses/{COURSE_ID}/videos")
        assert response.status_code == 200, f"Teacher should access videos, got {response.status_code}"
        
        data = response.json()
        assert "drive_videos" in data


class TestAdminCourseUpdate:
    """Tests for PUT /api/courses/{id} - admin can add drive_videos"""
    
    def test_admin_can_update_course_with_drive_videos(self, admin_session):
        """Admin can add drive_videos via PUT /api/courses/{id}"""
        # First get current course data
        get_response = admin_session.get(f"{BASE_URL}/api/courses/{COURSE_ID}")
        assert get_response.status_code == 200
        course = get_response.json()
        
        # Prepare update payload with drive_videos
        update_payload = {
            "title": course["title"],
            "description": course["description"],
            "category": course["category"],
            "pricing": course["pricing"],
            "syllabus": course["syllabus"],
            "instructor": course["instructor"],
            "thumbnail": course.get("thumbnail"),
            "duration": course.get("duration"),
            "course_type": course.get("course_type"),
            "drive_videos": [
                {"title": "Test Video 1", "drive_file_id": "test_file_id_1"},
                {"title": "Test Video 2", "drive_file_id": "test_file_id_2"}
            ]
        }
        
        # Update course
        put_response = admin_session.put(
            f"{BASE_URL}/api/courses/{COURSE_ID}",
            json=update_payload
        )
        assert put_response.status_code == 200, f"Expected 200, got {put_response.status_code}"
        
        # Verify videos were saved by fetching them
        videos_response = admin_session.get(f"{BASE_URL}/api/courses/{COURSE_ID}/videos")
        assert videos_response.status_code == 200
        
        videos_data = videos_response.json()
        assert len(videos_data["drive_videos"]) >= 2, "Should have at least 2 videos"
        
        # Restore original videos
        restore_payload = {
            "title": course["title"],
            "description": course["description"],
            "category": course["category"],
            "pricing": course["pricing"],
            "syllabus": course["syllabus"],
            "instructor": course["instructor"],
            "thumbnail": course.get("thumbnail"),
            "duration": course.get("duration"),
            "course_type": course.get("course_type"),
            "drive_videos": [
                {"title": "Day 1 - Introduction to Agentic AI", "drive_file_id": "1BxiMVs0XTw9CfC7NbC_1a-demo-file-1"},
                {"title": "Day 2 - Setting Up Your Environment", "drive_file_id": "1BxiMVs0XTw9CfC7NbC_1a-demo-file-2"},
                {"title": "Day 3 - Building Your First Agent", "drive_file_id": "1BxiMVs0XTw9CfC7NbC_1a-demo-file-3"}
            ]
        }
        admin_session.put(f"{BASE_URL}/api/courses/{COURSE_ID}", json=restore_payload)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
