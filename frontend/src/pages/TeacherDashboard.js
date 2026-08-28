import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, BookOpen, Video, Calendar, Plus, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VideoManagement = ({ courses, fetchData }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [videoForm, setVideoForm] = useState({
    course_id: '',
    title: '',
    youtube_url: '',
    duration: '',
    order: 1,
    description: '',
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/videos`);
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/videos`, videoForm, {
        withCredentials: true,
      });
      toast.success('Video added successfully!');
      setShowDialog(false);
      setVideoForm({
        course_id: '',
        title: '',
        youtube_url: '',
        duration: '',
        order: 1,
        description: '',
      });
      fetchVideos();
    } catch (error) {
      toast.error('Failed to add video');
    }
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-outfit font-bold text-slate-800">Video Library</h2>
        <Button
          onClick={() => setShowDialog(true)}
          className="clay-button-primary"
          data-testid="add-video-btn"
        >
          <Plus className="w-4 h-4 mr-2" /> Upload Video
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const course = courses.find((c) => c.id === video.course_id);
            return (
              <div key={video.id} className="clay-card overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200">
                  {video.youtube_url && (
                    <img
                      src={getYouTubeThumbnail(video.youtube_url)}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  {course && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-outfit font-bold mb-2">
                      {course.title}
                    </span>
                  )}
                  <h3 className="text-lg font-outfit font-bold text-slate-900 mb-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-figtree mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Order: {video.order}</span>
                    {video.duration && <span>{video.duration} min</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit font-bold text-xl">
              Add Video to Library
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="video_course_id">Course</Label>
              <select
                id="video_course_id"
                value={videoForm.course_id}
                onChange={(e) => setVideoForm({ ...videoForm, course_id: e.target.value })}
                className="w-full mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2 font-figtree"
                required
                data-testid="video-course-select"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="video_title">Video Title</Label>
              <Input
                id="video_title"
                value={videoForm.title}
                onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                placeholder="Introduction to AWS Lex"
                required
                data-testid="video-title-input"
              />
            </div>
            <div>
              <Label htmlFor="youtube_url">YouTube URL</Label>
              <Input
                id="youtube_url"
                type="url"
                value={videoForm.youtube_url}
                onChange={(e) => setVideoForm({ ...videoForm, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                data-testid="video-url-input"
              />
              <p className="text-xs text-slate-500 mt-1">
                Upload video to YouTube first, then paste the URL here
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="video_duration">Duration (minutes)</Label>
                <Input
                  id="video_duration"
                  type="number"
                  value={videoForm.duration}
                  onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                  placeholder="45"
                  data-testid="video-duration-input"
                />
              </div>
              <div>
                <Label htmlFor="video_order">Order</Label>
                <Input
                  id="video_order"
                  type="number"
                  value={videoForm.order}
                  onChange={(e) => setVideoForm({ ...videoForm, order: parseInt(e.target.value) })}
                  required
                  data-testid="video-order-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="video_description">Description</Label>
              <Textarea
                id="video_description"
                value={videoForm.description}
                onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                rows={3}
                placeholder="Brief description of the video content"
                data-testid="video-description-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full clay-button-primary"
              data-testid="submit-video-btn"
            >
              Add Video
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [classForm, setClassForm] = useState({
    course_id: '',
    title: '',
    scheduled_at: '',
    zoom_link: '',
    duration: 60,
    description: '',
  });
  const [syllabusForm, setSyllabusForm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, coursesRes, classesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/teacher/students`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/courses`),
        axios.get(`${BACKEND_URL}/api/live-classes`),
      ]);
      setStudents(studentsRes.data);
      
      // Filter courses to show only those taught by this teacher
      const allCourses = coursesRes.data;
      const myCourses = allCourses.filter(course => course.instructor === user?.name);
      setCourses(myCourses);
      
      setLiveClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/live-classes`, classForm, {
        withCredentials: true,
      });
      toast.success('Live class scheduled successfully!');
      setShowClassDialog(false);
      setClassForm({
        course_id: '',
        title: '',
        scheduled_at: '',
        zoom_link: '',
        duration: 60,
        description: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to schedule class');
    }
  };

  const handleEditSyllabus = (course) => {
    setEditingCourse(course);
    setSyllabusForm(course.syllabus?.join('\n') || '');
    setShowEditDialog(true);
  };

  const handleUpdateSyllabus = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingCourse,
        syllabus: syllabusForm.split('\n').filter((s) => s.trim()),
      };
      await axios.put(`${BACKEND_URL}/api/courses/${editingCourse.id}`, payload, {
        withCredentials: true,
      });
      toast.success('Syllabus updated successfully!');
      setShowEditDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update syllabus');
    }
  };

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
            Teacher Dashboard
          </h1>
          <p className="text-lg font-figtree text-slate-600">
            Manage your courses and students
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="clay-card p-8">
            <Users className="w-10 h-10 text-blue-600 mb-4" />
            <p className="text-3xl font-outfit font-black text-slate-900 mb-1">
              {students.length}
            </p>
            <p className="text-sm font-figtree text-slate-600">Total Students</p>
          </div>

          <div className="clay-card p-8">
            <BookOpen className="w-10 h-10 text-blue-600 mb-4" />
            <p className="text-3xl font-outfit font-black text-slate-900 mb-1">
              {courses.length}
            </p>
            <p className="text-sm font-figtree text-slate-600">Active Courses</p>
          </div>

          <div className="clay-card p-8">
            <Calendar className="w-10 h-10 text-blue-600 mb-4" />
            <p className="text-3xl font-outfit font-black text-slate-900 mb-1">
              {liveClasses.length}
            </p>
            <p className="text-sm font-figtree text-slate-600">Scheduled Classes</p>
          </div>
        </div>

        <Tabs defaultValue="classes" className="space-y-8">
          <TabsList className="clay-card p-2">
            <TabsTrigger value="classes" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-classes">
              Live Classes
            </TabsTrigger>
            <TabsTrigger value="courses" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-courses">
              My Courses
            </TabsTrigger>
            <TabsTrigger value="videos" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-videos">
              Video Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-outfit font-bold text-slate-800">Live Classes Schedule</h2>
                  <p className="text-sm text-slate-600 font-figtree mt-1">
                    Schedule and manage live sessions for your courses
                  </p>
                </div>
                <Button
                  onClick={() => setShowClassDialog(true)}
                  className="clay-button-primary"
                  data-testid="schedule-class-btn"
                >
                  <Plus className="w-4 h-4 mr-2" /> Schedule New Class
                </Button>
              </div>

              {liveClasses.length === 0 ? (
                <div className="clay-card p-12 text-center">
                  <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-figtree text-slate-600 mb-4">
                    No live classes scheduled yet
                  </p>
                  <Button
                    onClick={() => setShowClassDialog(true)}
                    className="clay-button-primary"
                  >
                    Schedule Your First Class
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveClasses.map((liveClass) => {
                    const course = courses.find((c) => c.id === liveClass.course_id);
                    return (
                      <div key={liveClass.id} className="clay-card p-6 hover:shadow-clay-card-hover transition-all">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {course && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-outfit font-bold">
                                  {course.title}
                                </span>
                              )}
                              <span className="text-xs text-slate-500 font-figtree">
                                {new Date(liveClass.scheduled_at) > new Date() ? (
                                  <span className="text-green-600 font-bold">Upcoming</span>
                                ) : (
                                  <span className="text-slate-400">Completed</span>
                                )}
                              </span>
                            </div>
                            <h3 className="text-lg font-outfit font-bold text-slate-800 mb-2">
                              {liveClass.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-slate-600 font-figtree">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(liveClass.scheduled_at).toLocaleDateString('en-IN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              <span>
                                {new Date(liveClass.scheduled_at).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span>{liveClass.duration} min</span>
                            </div>
                          </div>
                          <a href={liveClass.zoom_link} target="_blank" rel="noopener noreferrer">
                            <Button className="clay-button-primary" data-testid={`start-class-${liveClass.id}`}>
                              <Play className="w-4 h-4 mr-2" />
                              Start Class
                            </Button>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="courses">
            <div>
              <h2 className="text-2xl font-outfit font-bold text-slate-800 mb-6">My Courses</h2>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="clay-card p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-outfit font-bold text-slate-900 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-slate-600 font-figtree mb-3">
                          {course.description}
                        </p>
                        <div className="flex gap-4 text-sm">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-outfit font-bold">
                            {course.category}
                          </span>
                          <span className="text-slate-600">₹{course.pricing?.live} (Live)</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEditSyllabus(course)}
                        className="clay-button-secondary"
                        data-testid={`edit-syllabus-${course.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" /> Edit Syllabus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="videos">
            <VideoManagement courses={courses} fetchData={fetchData} />
          </TabsContent>
        </Tabs>

        {/* Schedule Class Dialog */}
        <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-outfit font-bold text-xl">
                Schedule Live Class
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleScheduleClass} className="space-y-4">
              <div>
                <Label htmlFor="course_id">Course</Label>
                <select
                  id="course_id"
                  value={classForm.course_id}
                  onChange={(e) => setClassForm({ ...classForm, course_id: e.target.value })}
                  className="w-full mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2 font-figtree"
                  required
                  data-testid="class-course-select"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="title">Class Title</Label>
                <Input
                  id="title"
                  value={classForm.title}
                  onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                  placeholder="Introduction to AWS Lex"
                  required
                  data-testid="class-title-input"
                />
              </div>
              <div>
                <Label htmlFor="scheduled_at">Scheduled Date & Time</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={classForm.scheduled_at}
                  onChange={(e) => setClassForm({ ...classForm, scheduled_at: e.target.value })}
                  required
                  data-testid="class-datetime-input"
                />
              </div>
              <div>
                <Label htmlFor="zoom_link">Zoom Link</Label>
                <Input
                  id="zoom_link"
                  type="url"
                  value={classForm.zoom_link}
                  onChange={(e) => setClassForm({ ...classForm, zoom_link: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  required
                  data-testid="class-zoom-link-input"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={classForm.duration}
                  onChange={(e) =>
                    setClassForm({ ...classForm, duration: parseInt(e.target.value) })
                  }
                  required
                  data-testid="class-duration-input"
                />
              </div>
              <Button
                type="submit"
                className="w-full clay-button-primary"
                data-testid="submit-schedule-class-btn"
              >
                Schedule Class
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Syllabus Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-outfit font-bold text-xl">
                Edit Course Syllabus
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSyllabus} className="space-y-4">
              <div>
                <Label>Course: {editingCourse?.title}</Label>
              </div>
              <div>
                <Label htmlFor="syllabus">Syllabus (one item per line)</Label>
                <Textarea
                  id="syllabus"
                  value={syllabusForm}
                  onChange={(e) => setSyllabusForm(e.target.value)}
                  rows={10}
                  placeholder="Introduction to Agentic AI\nAWS Lex Fundamentals\nLambda Integration"
                  required
                  data-testid="edit-syllabus-input"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 clay-button-primary"
                  data-testid="save-syllabus-btn"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowEditDialog(false)}
                  className="clay-button-secondary"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TeacherDashboard;