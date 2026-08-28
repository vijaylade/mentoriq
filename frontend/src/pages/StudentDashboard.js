import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Play, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enrollmentsRes, coursesRes, classesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/enrollments`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/courses`),
        axios.get(`${BACKEND_URL}/api/live-classes`),
      ]);
      setEnrollments(enrollmentsRes.data);
      setCourses(coursesRes.data);
      setLiveClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrolledCourses = courses.filter((course) =>
    enrollments.some((e) => e.course_id === course.id)
  );

  const upcomingClasses = liveClasses
    .filter((c) => enrollments.some((e) => e.course_id === c.course_id))
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl sm:text-5xl font-outfit font-black tracking-tighter text-slate-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-lg font-figtree text-slate-600">
            Continue your learning journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="clay-card p-8">
            <BookOpen className="w-10 h-10 text-blue-600 mb-4" />
            <p className="text-3xl font-outfit font-black text-slate-900 mb-1">
              {enrolledCourses.length}
            </p>
            <p className="text-sm font-figtree text-slate-600">Enrolled Courses</p>
          </div>

          <div className="clay-card p-8">
            <Calendar className="w-10 h-10 text-blue-600 mb-4" />
            <p className="text-3xl font-outfit font-black text-slate-900 mb-1">
              {upcomingClasses.length}
            </p>
            <p className="text-sm font-figtree text-slate-600">Upcoming Classes</p>
          </div>

          <div className="clay-card p-8">
            <Play className="w-10 h-10 text-blue-600 mb-4" />
            <p className="text-3xl font-outfit font-black text-slate-900 mb-1">
              {enrollments.filter((e) => e.enrollment_type === 'recorded').length}
            </p>
            <p className="text-sm font-figtree text-slate-600">Video Courses</p>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-outfit font-bold text-slate-800">My Courses</h2>
            <Link to="/courses" data-testid="browse-more-courses-link">
              <Button className="clay-button-secondary">
                Browse More <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="clay-card p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-figtree text-slate-600 mb-4">
                You haven't enrolled in any courses yet
              </p>
              <Link to="/courses" data-testid="start-learning-link">
                <Button className="clay-button-primary">
                  Start Learning
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="clay-card clay-card-hover overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-blue-100 to-indigo-100">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-outfit font-bold text-slate-800 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-600 font-figtree mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <Link to={`/courses/${course.id}`}>
                      <Button className="w-full clay-button-primary py-2 text-sm">
                        Continue Learning
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Live Classes */}
        {upcomingClasses.length > 0 && (
          <div>
            <h2 className="text-2xl font-outfit font-bold text-slate-800 mb-6">
              Upcoming Live Classes
            </h2>
            <div className="space-y-4">
              {upcomingClasses.map((liveClass) => {
                const course = courses.find((c) => c.id === liveClass.course_id);
                return (
                  <div key={liveClass.id} className="clay-card p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-outfit font-bold text-slate-800 mb-1">
                          {liveClass.title}
                        </h3>
                        {course && (
                          <p className="text-sm text-slate-600 font-figtree mb-2">
                            {course.title}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-figtree">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(liveClass.scheduled_at).toLocaleDateString()}
                          </span>
                          <span>
                            {new Date(liveClass.scheduled_at).toLocaleTimeString()}
                          </span>
                          <span>{liveClass.duration} min</span>
                        </div>
                      </div>
                      <a
                        href={liveClass.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`join-class-${liveClass.id}`}
                      >
                        <Button className="clay-button-primary">
                          Join Class
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;