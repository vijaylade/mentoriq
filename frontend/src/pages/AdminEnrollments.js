import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, Users, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [enrollType, setEnrollType] = useState('recorded');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [enrollRes, usersRes, coursesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/enrollments`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/admin/users`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/courses`),
      ]);
      setEnrollments(enrollRes.data);
      setUsers(usersRes.data.filter(u => u.role === 'student'));
      setCourses(coursesRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedCourse) {
      toast.error('Please select both a student and a course');
      return;
    }
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/admin/enroll`, {
        user_id: selectedUser,
        course_id: selectedCourse,
        enrollment_type: enrollType,
      }, { withCredentials: true });
      toast.success(data.message);
      setShowDialog(false);
      setSelectedUser('');
      setSelectedCourse('');
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to enroll student');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="clay-card p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-outfit font-bold text-slate-800">Enrollments</h2>
            <p className="text-sm text-slate-600 font-figtree mt-1">
              View all enrollments and manually enroll students in courses
            </p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="clay-button-primary"
            data-testid="manual-enroll-btn"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Enroll Student
          </Button>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-figtree text-slate-600">No enrollments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Student</th>
                  <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Email</th>
                  <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Course</th>
                  <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Type</th>
                  <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Source</th>
                  <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Enrolled On</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr, idx) => (
                  <tr key={enr.id || idx} className="border-b border-slate-100" data-testid={`enrollment-row-${idx}`}>
                    <td className="py-3 px-4 font-figtree text-slate-700 font-medium">{enr.student_name}</td>
                    <td className="py-3 px-4 font-figtree text-slate-600 text-sm">{enr.student_email}</td>
                    <td className="py-3 px-4 font-figtree text-slate-700">{enr.course_title}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-outfit font-bold ${
                        enr.enrollment_type === 'live' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {enr.enrollment_type === 'live' ? 'LIVE' : 'RECORDED'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-outfit font-bold ${
                        enr.manually_enrolled ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {enr.manually_enrolled ? 'Manual' : 'Payment'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-figtree text-slate-600 text-sm">
                      {enr.enrolled_at ? new Date(enr.enrolled_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit font-bold text-2xl">
              Enroll Student in Course
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-5">
            <div>
              <Label htmlFor="enroll_student">Select Student</Label>
              <select
                id="enroll_student"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2.5 font-figtree"
                required
                data-testid="enroll-student-select"
              >
                <option value="">Choose a student...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="text-xs text-orange-600 font-figtree mt-1">
                  No students found. Create a student account first from the Users tab.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="enroll_course">Select Course</Label>
              <select
                id="enroll_course"
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  const course = courses.find(c => c.id === e.target.value);
                  if (course) {
                    setEnrollType(course.course_type === 'live' ? 'live' : 'recorded');
                  }
                }}
                className="w-full mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2.5 font-figtree"
                required
                data-testid="enroll-course-select"
              >
                <option value="">Choose a course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.course_type === 'live' ? 'LIVE' : 'RECORDED'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="enroll_type">Enrollment Type</Label>
              <select
                id="enroll_type"
                value={enrollType}
                onChange={(e) => setEnrollType(e.target.value)}
                className="w-full mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2.5 font-figtree"
                data-testid="enroll-type-select"
              >
                <option value="recorded">Recorded</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 clay-button-primary" data-testid="submit-enroll-btn">
                Enroll Student
              </Button>
              <Button type="button" onClick={() => setShowDialog(false)} className="clay-button-secondary">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEnrollments;
