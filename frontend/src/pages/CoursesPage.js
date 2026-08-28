import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import ClayCourseThumbnail from '../components/ClayCourseThumbnail';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/courses`);
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/enrollments/my-courses`, { withCredentials: true });
      setEnrolledCourseIds(data);
    } catch (error) {
      // Not logged in or error — ignore
    }
  };

  const getEffectiveType = (course) =>
    course.course_type || (course.pricing?.live ? 'live' : 'recorded');

  const filteredCourses =
    filter === 'all' ? courses : courses.filter((course) => course.category === filter);

  const categories = ['all', ...new Set(courses.map((c) => c.category))];

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
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl sm:text-5xl font-outfit font-black tracking-tighter text-slate-900 mb-4">
            Explore Our Courses
          </h1>
          <p className="text-lg font-figtree text-slate-600 max-w-2xl mx-auto">
            Master Agentic AI and Conversational AI with our comprehensive courses
          </p>
        </motion.div>

        {/* Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-6 py-3 rounded-2xl font-outfit font-bold transition-all ${
                filter === category ? 'clay-button-primary' : 'clay-button-secondary'
              }`}
              data-testid={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {category === 'all' ? 'All Courses' : category}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course, idx) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            const effectiveType = getEffectiveType(course);

            return (
              <motion.div
                key={course.id}
                className="clay-card clay-card-hover overflow-hidden relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                {isEnrolled && (
                  <div
                    className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-outfit font-bold flex items-center gap-1"
                    style={{
                      boxShadow: '4px 4px 10px rgba(34, 197, 94, 0.3), -2px -2px 6px rgba(255,255,255,0.5)',
                    }}
                    data-testid={`enrolled-badge-${course.id}`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                  </div>
                )}
                <ClayCourseThumbnail
                  title={course.title}
                  category={course.category}
                  className="h-48 w-full"
                />
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-outfit font-bold">
                      {course.category}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-outfit font-bold ${
                      effectiveType === 'live' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {effectiveType === 'live' ? 'LIVE' : 'RECORDED'}
                    </span>
                  </div>
                  <h3 className="text-xl font-outfit font-bold text-slate-800 mb-3">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-figtree mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-slate-500 font-figtree">
                        {effectiveType === 'live' ? 'Starting from' : 'One-time'}
                      </p>
                      <p className="text-2xl font-outfit font-bold text-blue-600">
                        ₹{effectiveType === 'live' ? course.pricing?.live : course.pricing?.recorded}
                        {effectiveType === 'live' && <span className="text-sm">/mo</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-figtree">Instructor</p>
                      <p className="text-sm font-outfit font-bold text-slate-700">
                        {course.instructor}
                      </p>
                    </div>
                  </div>
                  <Link to={`/courses/${course.id}`} data-testid={`course-detail-link-${course.id}`}>
                    <Button className={`w-full py-3 ${isEnrolled ? 'clay-button-secondary' : 'clay-button-primary'}`}>
                      {isEnrolled ? 'Continue Learning' : 'View Details'} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-figtree text-slate-600">No courses found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
