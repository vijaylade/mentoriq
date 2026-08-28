"""
Test Iteration 5 Features:
1. Admin manual enrollment (POST /api/admin/enroll)
2. Admin enrollments list (GET /api/admin/enrollments)
3. Enrollment validation (user_id, course_id, duplicate prevention)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://127.0.0.1:8000').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@mentoriq.com"
ADMIN_PASSWORD = "Admin@123"


class TestAdminEnrollmentFeatures:
    """Test admin manual enrollment functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with admin login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.admin_user = login_response.json()
        print(f"Admin logged in: {self.admin_user['email']}")
        
        yield
        
        # Cleanup: logout
        self.session.post(f"{BASE_URL}/api/auth/logout")
    
    def test_admin_login_success(self):
        """Test admin can login successfully"""
        assert self.admin_user["role"] == "admin"
        assert self.admin_user["email"] == ADMIN_EMAIL
        print("PASS: Admin login successful")
    
    def test_get_admin_enrollments_endpoint(self):
        """Test GET /api/admin/enrollments returns enrollment list"""
        response = self.session.get(f"{BASE_URL}/api/admin/enrollments")
        assert response.status_code == 200, f"Failed to get enrollments: {response.text}"
        
        enrollments = response.json()
        assert isinstance(enrollments, list), "Enrollments should be a list"
        print(f"PASS: GET /api/admin/enrollments returned {len(enrollments)} enrollments")
        
        # Check enriched data structure if enrollments exist
        if enrollments:
            enr = enrollments[0]
            assert "student_name" in enr, "Enrollment should have student_name"
            assert "course_title" in enr, "Enrollment should have course_title"
            assert "manually_enrolled" in enr or "payment_status" in enr, "Enrollment should have source indicator"
            print(f"PASS: Enrollment data is enriched with student_name and course_title")
    
    def test_get_admin_users_endpoint(self):
        """Test GET /api/admin/users returns user list"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        
        users = response.json()
        assert isinstance(users, list), "Users should be a list"
        print(f"PASS: GET /api/admin/users returned {len(users)} users")
        
        # Check for students
        students = [u for u in users if u.get("role") == "student"]
        print(f"Found {len(students)} students in user list")
        return students
    
    def test_get_courses_endpoint(self):
        """Test GET /api/courses returns course list"""
        response = self.session.get(f"{BASE_URL}/api/courses")
        assert response.status_code == 200, f"Failed to get courses: {response.text}"
        
        courses = response.json()
        assert isinstance(courses, list), "Courses should be a list"
        assert len(courses) > 0, "Should have at least one course"
        print(f"PASS: GET /api/courses returned {len(courses)} courses")
        return courses
    
    def test_admin_create_student_for_enrollment(self):
        """Create a test student for enrollment testing"""
        import uuid
        test_email = f"test_student_{uuid.uuid4().hex[:8]}@test.com"
        
        response = self.session.post(
            f"{BASE_URL}/api/admin/users",
            json={
                "email": test_email,
                "password": "TestPass123",
                "name": "Test Student for Enrollment",
                "role": "student"
            }
        )
        assert response.status_code == 200, f"Failed to create student: {response.text}"
        
        student = response.json()
        assert student["role"] == "student"
        assert student["email"] == test_email
        print(f"PASS: Created test student: {student['email']} (id: {student['id']})")
        return student
    
    def test_admin_manual_enroll_success(self):
        """Test POST /api/admin/enroll creates enrollment successfully"""
        # First create a test student
        import uuid
        test_email = f"enroll_test_{uuid.uuid4().hex[:8]}@test.com"
        
        student_response = self.session.post(
            f"{BASE_URL}/api/admin/users",
            json={
                "email": test_email,
                "password": "TestPass123",
                "name": "Enrollment Test Student",
                "role": "student"
            }
        )
        assert student_response.status_code == 200, f"Failed to create student: {student_response.text}"
        student = student_response.json()
        
        # Get a course
        courses_response = self.session.get(f"{BASE_URL}/api/courses")
        courses = courses_response.json()
        assert len(courses) > 0, "No courses available for enrollment"
        course = courses[0]
        
        # Enroll the student
        enroll_response = self.session.post(
            f"{BASE_URL}/api/admin/enroll",
            json={
                "user_id": student["id"],
                "course_id": course["id"],
                "enrollment_type": "recorded"
            }
        )
        assert enroll_response.status_code == 200, f"Failed to enroll: {enroll_response.text}"
        
        result = enroll_response.json()
        assert "message" in result, "Response should have message"
        assert "Successfully enrolled" in result["message"], f"Unexpected message: {result['message']}"
        print(f"PASS: Manual enrollment successful - {result['message']}")
        
        # Verify enrollment appears in list
        enrollments_response = self.session.get(f"{BASE_URL}/api/admin/enrollments")
        enrollments = enrollments_response.json()
        
        # Find our enrollment
        found = False
        for enr in enrollments:
            if enr.get("student_id") == student["id"] and enr.get("course_id") == course["id"]:
                found = True
                assert enr.get("manually_enrolled") == True, "Enrollment should be marked as manually_enrolled"
                print(f"PASS: Enrollment verified in list with manually_enrolled=True")
                break
        
        assert found, "Enrollment not found in enrollments list"
        
        # Cleanup: delete the test student
        self.session.delete(f"{BASE_URL}/api/admin/users/{student['id']}")
    
    def test_admin_enroll_invalid_user(self):
        """Test POST /api/admin/enroll with invalid user_id returns 404"""
        courses_response = self.session.get(f"{BASE_URL}/api/courses")
        courses = courses_response.json()
        course = courses[0]
        
        response = self.session.post(
            f"{BASE_URL}/api/admin/enroll",
            json={
                "user_id": "000000000000000000000000",  # Invalid ObjectId
                "course_id": course["id"],
                "enrollment_type": "recorded"
            }
        )
        assert response.status_code == 404, f"Expected 404 for invalid user, got {response.status_code}"
        print("PASS: Invalid user_id returns 404")
    
    def test_admin_enroll_invalid_course(self):
        """Test POST /api/admin/enroll with invalid course_id returns 404"""
        # Get a valid user
        users_response = self.session.get(f"{BASE_URL}/api/admin/users")
        users = users_response.json()
        students = [u for u in users if u.get("role") == "student"]
        
        if not students:
            pytest.skip("No students available for testing")
        
        response = self.session.post(
            f"{BASE_URL}/api/admin/enroll",
            json={
                "user_id": students[0]["id"],
                "course_id": "invalid-course-id-12345",
                "enrollment_type": "recorded"
            }
        )
        assert response.status_code == 404, f"Expected 404 for invalid course, got {response.status_code}"
        print("PASS: Invalid course_id returns 404")
    
    def test_admin_enroll_duplicate_prevention(self):
        """Test POST /api/admin/enroll prevents duplicate enrollment"""
        import uuid
        test_email = f"dup_test_{uuid.uuid4().hex[:8]}@test.com"
        
        # Create student
        student_response = self.session.post(
            f"{BASE_URL}/api/admin/users",
            json={
                "email": test_email,
                "password": "TestPass123",
                "name": "Duplicate Test Student",
                "role": "student"
            }
        )
        student = student_response.json()
        
        # Get course
        courses = self.session.get(f"{BASE_URL}/api/courses").json()
        course = courses[0]
        
        # First enrollment - should succeed
        first_enroll = self.session.post(
            f"{BASE_URL}/api/admin/enroll",
            json={
                "user_id": student["id"],
                "course_id": course["id"],
                "enrollment_type": "recorded"
            }
        )
        assert first_enroll.status_code == 200, f"First enrollment failed: {first_enroll.text}"
        
        # Second enrollment - should fail with 400
        second_enroll = self.session.post(
            f"{BASE_URL}/api/admin/enroll",
            json={
                "user_id": student["id"],
                "course_id": course["id"],
                "enrollment_type": "recorded"
            }
        )
        assert second_enroll.status_code == 400, f"Expected 400 for duplicate, got {second_enroll.status_code}"
        assert "already enrolled" in second_enroll.json().get("detail", "").lower(), "Should mention already enrolled"
        print("PASS: Duplicate enrollment prevented with 400 error")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/admin/users/{student['id']}")
    
    def test_admin_enrollments_enriched_data(self):
        """Test GET /api/admin/enrollments returns enriched data with student_name and course_title"""
        response = self.session.get(f"{BASE_URL}/api/admin/enrollments")
        assert response.status_code == 200
        
        enrollments = response.json()
        if enrollments:
            enr = enrollments[0]
            # Check enriched fields
            assert "student_name" in enr, "Missing student_name field"
            assert "student_email" in enr, "Missing student_email field"
            assert "course_title" in enr, "Missing course_title field"
            print(f"PASS: Enrollment enriched data verified - student: {enr['student_name']}, course: {enr['course_title']}")
        else:
            print("INFO: No enrollments to verify enriched data")


class TestNonAdminEnrollmentAccess:
    """Test that non-admin users cannot access admin enrollment endpoints"""
    
    def test_unauthenticated_cannot_access_admin_enrollments(self):
        """Test unauthenticated user cannot access admin enrollments"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/enrollments")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Unauthenticated user cannot access admin enrollments")
    
    def test_unauthenticated_cannot_enroll(self):
        """Test unauthenticated user cannot use admin enroll endpoint"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/admin/enroll",
            json={"user_id": "test", "course_id": "test", "enrollment_type": "recorded"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Unauthenticated user cannot use admin enroll endpoint")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
