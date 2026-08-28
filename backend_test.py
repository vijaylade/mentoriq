import requests
import sys
import json
from datetime import datetime

class MentoriQAPITester:
    def __init__(self, base_url="https://agentic-academy-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.teacher_token = None
        self.student_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_token=None, use_cookies=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers) if use_cookies else requests.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers) if use_cookies else requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers) if use_cookies else requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers) if use_cookies else requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        print("\n=== Testing Admin Authentication ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "admin@mentoriq.com", "password": "Admin@123"}
        )
        if success and 'id' in response:
            print(f"Admin logged in successfully: {response.get('name')} ({response.get('role')})")
            return True
        return False

    def test_teacher_login(self):
        """Test teacher login"""
        print("\n=== Testing Teacher Authentication ===")
        success, response = self.run_test(
            "Teacher Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "teacher@mentoriq.com", "password": "Teacher@123"}
        )
        if success and 'id' in response:
            print(f"Teacher logged in successfully: {response.get('name')} ({response.get('role')})")
            return True
        return False

    def test_student_registration(self):
        """Test student registration"""
        print("\n=== Testing Student Registration ===")
        test_email = f"test_student_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "Student Registration",
            "POST",
            "api/auth/register",
            200,
            data={
                "email": test_email,
                "password": "Test@123",
                "name": "Test Student",
                "role": "student"
            }
        )
        if success and 'id' in response:
            print(f"Student registered successfully: {response.get('name')} ({response.get('role')})")
            return True, test_email
        return False, None

    def test_courses_api(self):
        """Test courses endpoints"""
        print("\n=== Testing Courses API ===")
        
        # Get all courses
        success, courses = self.run_test(
            "Get All Courses",
            "GET",
            "api/courses",
            200
        )
        
        if success and isinstance(courses, list):
            print(f"Found {len(courses)} courses")
            if len(courses) > 0:
                course = courses[0]
                print(f"Sample course: {course.get('title', 'Unknown')}")
                
                # Test get single course
                course_id = course.get('id')
                if course_id:
                    success, single_course = self.run_test(
                        "Get Single Course",
                        "GET",
                        f"api/courses/{course_id}",
                        200
                    )
                    if success:
                        print(f"Retrieved course details: {single_course.get('title', 'Unknown')}")
                        return True, course_id
        
        return False, None

    def test_auth_me(self):
        """Test auth/me endpoint"""
        print("\n=== Testing Auth Me Endpoint ===")
        success, user_data = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        if success:
            print(f"Current user: {user_data.get('name')} ({user_data.get('role')})")
            return True
        return False

    def test_enrollment_check(self, course_id):
        """Test enrollment check endpoint"""
        print("\n=== Testing Enrollment Check ===")
        success, enrollment_data = self.run_test(
            "Check Enrollment",
            "GET",
            f"api/enrollments/check/{course_id}",
            200
        )
        if success:
            enrolled = enrollment_data.get('enrolled', False)
            print(f"Enrollment status: {'Enrolled' if enrolled else 'Not enrolled'}")
            return True
        return False

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n=== Testing Admin Endpoints ===")
        
        # Test admin stats
        success, stats = self.run_test(
            "Get Admin Stats",
            "GET",
            "api/admin/stats",
            200
        )
        if success:
            print(f"Admin stats: {stats}")
        
        # Test get users
        success, users = self.run_test(
            "Get All Users",
            "GET",
            "api/admin/users",
            200
        )
        if success and isinstance(users, list):
            print(f"Found {len(users)} users")
            return True
        
        return False

    def test_testimonials(self):
        """Test testimonials endpoint"""
        print("\n=== Testing Testimonials ===")
        success, testimonials = self.run_test(
            "Get Testimonials",
            "GET",
            "api/testimonials",
            200
        )
        if success and isinstance(testimonials, list):
            print(f"Found {len(testimonials)} testimonials")
            return True
        return False

    def test_logout(self):
        """Test logout"""
        print("\n=== Testing Logout ===")
        success, response = self.run_test(
            "Logout",
            "POST",
            "api/auth/logout",
            200
        )
        if success:
            print("Logout successful")
            return True
        return False

def main():
    print("🚀 Starting MentoriQ API Testing...")
    tester = MentoriQAPITester()
    
    # Test basic endpoints that don't require auth
    print("\n" + "="*50)
    print("TESTING PUBLIC ENDPOINTS")
    print("="*50)
    
    # Test courses (public)
    courses_success, course_id = tester.test_courses_api()
    
    # Test testimonials (public)
    testimonials_success = tester.test_testimonials()
    
    # Test authentication flows
    print("\n" + "="*50)
    print("TESTING AUTHENTICATION")
    print("="*50)
    
    # Test admin login
    admin_login_success = tester.test_admin_login()
    
    if admin_login_success:
        # Test auth/me with admin
        auth_me_success = tester.test_auth_me()
        
        # Test admin endpoints
        admin_endpoints_success = tester.test_admin_endpoints()
        
        # Test enrollment check (requires auth)
        if course_id:
            enrollment_check_success = tester.test_enrollment_check(course_id)
        
        # Test logout
        logout_success = tester.test_logout()
    
    # Test teacher login
    teacher_login_success = tester.test_teacher_login()
    
    if teacher_login_success:
        # Test auth/me with teacher
        teacher_auth_me_success = tester.test_auth_me()
        tester.test_logout()
    
    # Test student registration and login
    student_reg_success, student_email = tester.test_student_registration()
    
    if student_reg_success:
        # Test auth/me with student
        student_auth_me_success = tester.test_auth_me()
        tester.test_logout()
    
    # Print final results
    print("\n" + "="*50)
    print("TEST RESULTS SUMMARY")
    print("="*50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📈 Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())