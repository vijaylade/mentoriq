import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Clock, BookOpen, CheckCircle, ArrowLeft, Play, Lock, Film } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useRazorpay } from 'react-razorpay';

import ClayCourseThumbnail from '../components/ClayCourseThumbnail';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { Razorpay } = useRazorpay();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [courseVideos, setCourseVideos] = useState([]);
  const [youtubeEmbed, setYoutubeEmbed] = useState(null);
  const [activeVideo, setActiveVideo] = useState(0);

  useEffect(() => {
    fetchCourseDetails();
    if (user) {
      checkEnrollment();
    }
  }, [courseId, user]);

  const fetchCourseDetails = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/courses/${courseId}`);
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/enrollments/check/${courseId}`,
        { withCredentials: true }
      );
      setEnrolled(data.enrolled);
      if (data.enrolled) {
        fetchCourseVideos();
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const fetchCourseVideos = async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/courses/${courseId}/videos`,
        { withCredentials: true }
      );
      if (data.drive_videos && data.drive_videos.length > 0) {
        setCourseVideos(data.drive_videos);
      }
      if (data.youtube_embed) {
        setYoutubeEmbed(data.youtube_embed);
      }
    } catch (error) {
      // Not enrolled or no videos
    }
  };

  const handleEnroll = async (enrollmentType) => {
    if (!user) {
      toast.error('Please login to enroll');
      navigate('/login');
      return;
    }

    setProcessing(true);
    try {
      const isSubscription = enrollmentType === 'live';
      
      // Create Razorpay order
      const { data } = await axios.post(
        `${BACKEND_URL}/api/payments/create-order`,
        {
          course_id: courseId,
          enrollment_type: enrollmentType,
          origin_url: window.location.origin,
          is_subscription: isSubscription,
        },
        { withCredentials: true }
      );

      // Initialize Razorpay payment
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'Altanon Learn',
        description: `Enrollment: ${course.title}`,
        image: 'https://your-logo-url.com/logo.png',
        handler: async function (response) {
          try {
            // Verify payment on backend
            await axios.post(
              `${BACKEND_URL}/api/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );
            
            toast.success('Payment successful! You are now enrolled.');
            navigate('/dashboard');
          } catch (error) {
            toast.error('Payment verification failed');
            setProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-slate-600">Course not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 font-figtree"
          data-testid="back-to-courses-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              className="clay-card p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6">
                <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-outfit font-bold mb-4">
                  {course.category}
                </span>
                <h1 className="text-3xl sm:text-4xl font-outfit font-extrabold tracking-tight text-slate-900 mb-4">
                  {course.title}
                </h1>
                <div className="flex items-center gap-6 text-sm text-slate-600 font-figtree">
                  {course.duration && (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {course.duration}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> {course.syllabus?.length || 0} Modules
                  </span>
                </div>
              </div>

              <ClayCourseThumbnail
                title={course.title}
                category={course.category}
                className="h-64 w-full mb-6"
              />

              <div>
                <h2 className="text-2xl font-outfit font-bold text-slate-800 mb-4">
                  About This Course
                </h2>
                <p className="text-base font-figtree text-slate-600 leading-relaxed">
                  {course.description}
                </p>
              </div>
            </motion.div>

            {/* Syllabus */}
            <motion.div
              className="clay-card p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl font-outfit font-bold text-slate-800 mb-6">
                Course Syllabus
              </h2>
              <div className="space-y-3">
                {course.syllabus && course.syllabus.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-xl bg-slate-50"
                  >
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="font-figtree text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Course Videos - Only for enrolled students */}
            {enrolled && courseVideos.length > 0 && (
              <motion.div
                className="clay-card p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                data-testid="course-videos-section"
              >
                <h2 className="text-2xl font-outfit font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Film className="w-7 h-7 text-blue-600" />
                  Course Videos
                  <span className="text-sm font-figtree font-normal text-slate-500 ml-auto">
                    {courseVideos.length} {courseVideos.length === 1 ? 'video' : 'videos'}
                  </span>
                </h2>

                {/* Active Video Player */}
                {courseVideos[activeVideo]?.embed_url && (
                  <div className="rounded-2xl overflow-hidden bg-black aspect-video mb-6" data-testid="video-player">
                    <iframe
                      src={courseVideos[activeVideo].embed_url}
                      title={courseVideos[activeVideo].title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      data-testid="active-video-iframe"
                    ></iframe>
                  </div>
                )}

                {/* Video List */}
                <div className="space-y-2" data-testid="video-list">
                  {courseVideos.map((video, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveVideo(idx)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 ${
                        activeVideo === idx
                          ? 'bg-blue-50 border-2 border-blue-300 shadow-[4px_4px_12px_rgba(59,130,246,0.15)]'
                          : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100 hover:border-slate-200'
                      }`}
                      data-testid={`video-item-${idx}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activeVideo === idx ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {activeVideo === idx ? (
                          <Play className="w-4 h-4 fill-current" />
                        ) : (
                          <span className="text-sm font-outfit font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <span className={`font-figtree ${
                        activeVideo === idx ? 'text-blue-700 font-bold' : 'text-slate-700'
                      }`}>
                        {video.title}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* YouTube Embed fallback - Only for enrolled students */}
            {enrolled && youtubeEmbed && courseVideos.length === 0 && (
              <motion.div
                className="clay-card p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                data-testid="youtube-playlist-section"
              >
                <h2 className="text-2xl font-outfit font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Film className="w-7 h-7 text-blue-600" />
                  Course Videos
                </h2>
                <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                  <iframe
                    src={youtubeEmbed}
                    title="Course Playlist"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    data-testid="youtube-playlist-iframe"
                  ></iframe>
                </div>
              </motion.div>
            )}

            {/* Locked Videos Message - for non-enrolled users when course has videos */}
            {!enrolled && course.has_videos && (
              <motion.div
                className="clay-card p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                data-testid="locked-videos-section"
              >
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-outfit font-bold text-slate-800 mb-2">
                    Course Videos Locked
                  </h3>
                  <p className="text-sm font-figtree text-slate-500 max-w-md">
                    Enroll in this course to access all video lessons. Start learning at your own pace with our expertly crafted content.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              className="clay-card p-8 sticky top-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-outfit font-bold text-slate-800 mb-6">
                Enrollment Options
              </h3>

              {enrolled ? (
                <div className="p-6 bg-green-50 rounded-2xl border-2 border-green-200 mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                  <p className="font-outfit font-bold text-green-800 mb-1">
                    You're Enrolled!
                  </p>
                  <p className="text-sm text-green-600 font-figtree">
                    Access this course from your dashboard
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(course.course_type === 'live' || (!course.course_type && course.pricing?.live)) && course.pricing?.live && (
                    <div className="relative p-6 rounded-3xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-[8px_8px_20px_rgba(59,130,246,0.2),inset_2px_2px_8px_rgba(255,255,255,0.8)] hover:shadow-[12px_12px_30px_rgba(59,130,246,0.3),inset_2px_2px_8px_rgba(255,255,255,0.8)] transition-all duration-300 transform hover:-translate-y-1">
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-outfit font-bold rounded-full">
                          LIVE BATCH
                        </span>
                      </div>
                      <div className="mb-4">
                        <p className="text-xs font-outfit uppercase tracking-wider text-blue-600 mb-1">
                          Monthly Subscription
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-4xl font-outfit font-black text-blue-700">
                            ₹{course.pricing.live}
                          </p>
                          <span className="text-sm text-slate-500 font-figtree">/month</span>
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6 text-sm text-slate-700 font-figtree">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          Live interactive sessions
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          Direct instructor access
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          Q&A support & doubt clearing
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          Monthly billing - cancel anytime
                        </li>
                      </ul>
                      <Button
                        onClick={() => handleEnroll('live')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-outfit font-bold text-base shadow-[6px_6px_16px_rgba(37,99,235,0.3),inset_2px_2px_8px_rgba(255,255,255,0.2)] hover:shadow-[8px_8px_20px_rgba(37,99,235,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
                        disabled={processing}
                        data-testid="enroll-live-btn"
                      >
                        {processing ? 'Processing...' : 'Enroll in Live Batch'}
                      </Button>
                    </div>
                  )}

                  {(course.course_type === 'recorded' || (!course.course_type && course.pricing?.recorded)) && course.pricing?.recorded && (
                    <div className="relative p-6 rounded-3xl border-2 border-slate-300 bg-white shadow-[8px_8px_20px_rgba(0,0,0,0.08),inset_4px_4px_12px_rgba(255,255,255,1),inset_-4px_-4px_12px_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_30px_rgba(0,0,0,0.12),inset_4px_4px_12px_rgba(255,255,255,1)] transition-all duration-300 transform hover:-translate-y-1">
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-slate-600 text-white text-xs font-outfit font-bold rounded-full">
                          RECORDED
                        </span>
                      </div>
                      <div className="mb-4">
                        <p className="text-xs font-outfit uppercase tracking-wider text-slate-500 mb-1">
                          Self-Paced Learning
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-4xl font-outfit font-black text-slate-800">
                            ₹{course.pricing.recorded}
                          </p>
                          <span className="text-sm text-slate-500 font-figtree">one-time</span>
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6 text-sm text-slate-600 font-figtree">
                        <li className="flex items-center gap-2">
                          <Play className="w-5 h-5 text-slate-600 flex-shrink-0" />
                          Pre-recorded video lessons
                        </li>
                        <li className="flex items-center gap-2">
                          <Play className="w-5 h-5 text-slate-600 flex-shrink-0" />
                          Learn at your own pace
                        </li>
                        <li className="flex items-center gap-2">
                          <Play className="w-5 h-5 text-slate-600 flex-shrink-0" />
                          Lifetime access to content
                        </li>
                        <li className="flex items-center gap-2">
                          <Play className="w-5 h-5 text-slate-600 flex-shrink-0" />
                          One-time payment
                        </li>
                      </ul>
                      <Button
                        onClick={() => handleEnroll('recorded')}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-4 rounded-2xl font-outfit font-bold text-base shadow-[6px_6px_16px_rgba(0,0,0,0.08),inset_2px_2px_8px_rgba(255,255,255,1),inset_-2px_-2px_8px_rgba(0,0,0,0.05)] hover:shadow-[8px_8px_20px_rgba(0,0,0,0.12)] transition-all duration-300 transform hover:-translate-y-0.5"
                        disabled={processing}
                        data-testid="enroll-recorded-btn"
                      >
                        {processing ? 'Processing...' : 'Enroll for Recorded'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-outfit font-bold text-slate-700 mb-3">
                  Course Instructor
                </h4>
                <p className="font-figtree text-slate-600">{course.instructor}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;