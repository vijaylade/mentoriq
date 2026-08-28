import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Upload, Film, X, GripVertical } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const extractDriveFileId = (url) => {
  if (!url) return null;
  // Match patterns: /file/d/FILE_ID/ or id=FILE_ID or /d/FILE_ID
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  // If it looks like a raw file ID (no slashes/URLs)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return url.trim();
  return null;
};

const AdminCoursesManagement = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [stockImages, setStockImages] = useState([]);
  const [driveVideos, setDriveVideos] = useState([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    course_type: 'live',
    pricing_live: '',
    pricing_recorded: '',
    syllabus: '',
    instructor: '',
    thumbnail: '',
    duration: '',
    youtube_playlist: '',
  });

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
    fetchStockImages();
  }, []);

  const fetchStockImages = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/stock-images`);
      setStockImages(data.images || []);
    } catch (error) {
      console.error('Error fetching stock images:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/admin/users`, {
        withCredentials: true,
      });
      const teacherList = data.filter((user) => user.role === 'teacher');
      setTeachers(teacherList);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/courses`);
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      course_type: course.course_type || 'live',
      pricing_live: course.pricing?.live || '',
      pricing_recorded: course.pricing?.recorded || '',
      syllabus: course.syllabus?.join('\n') || '',
      instructor: course.instructor,
      thumbnail: course.thumbnail,
      duration: course.duration || '',
      youtube_playlist: course.youtube_playlist || '',
    });
    setThumbnailFile(null);
    const thumb = course.thumbnail;
    setThumbnailPreview(thumb?.startsWith('/api') ? `${BACKEND_URL}${thumb}` : thumb || '');
    // Load drive videos for this course from the admin endpoint
    loadCourseVideos(course.id);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setShowDialog(true);
  };

  const loadCourseVideos = async (courseId) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/courses/${courseId}/videos`, {
        withCredentials: true,
      });
      setDriveVideos(
        (data.drive_videos || []).map((v, i) => ({
          title: v.title,
          drive_file_id: v.embed_url ? v.embed_url.split('/file/d/')[1]?.split('/')[0] : '',
        }))
      );
    } catch {
      setDriveVideos([]);
    }
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      course_type: 'live',
      pricing_live: '',
      pricing_recorded: '',
      syllabus: '',
      instructor: '',
      thumbnail: '',
      duration: '',
      youtube_playlist: '',
    });
    setThumbnailFile(null);
    setThumbnailPreview('');
    setDriveVideos([]);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setShowDialog(true);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let thumbnailUrl = formData.thumbnail;

      if (thumbnailFile) {
        const fd = new FormData();
        fd.append('image', thumbnailFile);
        const { data } = await axios.post(`${BACKEND_URL}/api/upload/image`, fd, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        thumbnailUrl = data.image_url;
      }

      const pricing = {};
      if (formData.course_type === 'live') {
        pricing.live = parseFloat(formData.pricing_live);
      } else {
        pricing.recorded = parseFloat(formData.pricing_recorded);
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        course_type: formData.course_type,
        pricing: pricing,
        syllabus: formData.syllabus.split('\n').filter((s) => s.trim()),
        instructor: formData.instructor,
        thumbnail: thumbnailUrl,
        duration: formData.duration,
        youtube_playlist: formData.youtube_playlist,
        drive_videos: driveVideos.filter((v) => v.drive_file_id),
      };

      if (editingCourse) {
        await axios.put(`${BACKEND_URL}/api/courses/${editingCourse.id}`, payload, {
          withCredentials: true,
        });
        toast.success('Course updated successfully');
      } else {
        await axios.post(`${BACKEND_URL}/api/courses`, payload, {
          withCredentials: true,
        });
        toast.success('Course created successfully');
      }

      setShowDialog(false);
      setThumbnailFile(null);
      fetchCourses();
    } catch (error) {
      toast.error('Failed to save course');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/courses/${courseId}`, {
        withCredentials: true,
      });
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const getImageSrc = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? `${BACKEND_URL}${url}` : url;
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-outfit font-black text-slate-900">
            Manage Courses
          </h1>
          <Button onClick={handleAdd} className="clay-button-primary" data-testid="add-course-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Course
          </Button>
        </div>

        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="clay-card p-6">
              <div className="flex gap-6">
                <img
                  src={getImageSrc(course.thumbnail)}
                  alt={course.title}
                  className="w-32 h-32 object-cover rounded-2xl bg-slate-200"
                  onError={(e) => { e.target.src = 'https://placehold.co/128x128/e2e8f0/64748b?text=Course'; }}
                />
                <div className="flex-1">
                  <h3 className="text-xl font-outfit font-bold text-slate-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-figtree mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex gap-4 text-sm text-slate-600 font-figtree">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                      {course.category}
                    </span>
                    <span>Instructor: {course.instructor}</span>
                    <span>Live: ₹{course.pricing?.live}</span>
                    <span>Recorded: ₹{course.pricing?.recorded}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(course)}
                    className="clay-button-secondary"
                    data-testid={`edit-course-${course.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(course.id)}
                    className="clay-button-secondary text-red-600"
                    data-testid={`delete-course-${course.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-outfit font-bold text-2xl">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="course-title-input"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                  data-testid="course-description-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    data-testid="course-category-input"
                  />
                </div>
                <div>
                  <Label htmlFor="course_type">Course Type</Label>
                  <select
                    id="course_type"
                    value={formData.course_type}
                    onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                    className="w-full mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2 font-figtree h-9"
                    required
                    data-testid="course-type-select"
                  >
                    <option value="live">Live Batch (Monthly Subscription)</option>
                    <option value="recorded">Recorded Course (One-time)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instructor">Select Teacher</Label>
                  <select
                    id="instructor"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="w-full mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2 font-figtree h-9"
                    required
                    data-testid="course-instructor-select"
                  >
                    <option value="">Choose a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 8 weeks, 3 months"
                    data-testid="course-duration-input"
                  />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Film className="w-4 h-4" /> Google Drive Videos
                </Label>
                <p className="text-xs text-slate-500 font-figtree mt-1 mb-3">
                  Paste Google Drive video share links. Make sure each video is shared as "Anyone with the link can view".
                </p>

                {/* Existing videos */}
                {driveVideos.length > 0 && (
                  <div className="space-y-2 mb-3" data-testid="drive-videos-list">
                    {driveVideos.map((video, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-outfit font-bold text-blue-700">{idx + 1}</span>
                        </div>
                        <span className="flex-1 text-sm font-figtree text-slate-700 truncate">
                          {video.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDriveVideos(driveVideos.filter((_, i) => i !== idx));
                          }}
                          className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                          data-testid={`remove-video-${idx}`}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new video */}
                <div className="flex gap-2">
                  <Input
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder={`Day ${driveVideos.length + 1}`}
                    className="w-32 flex-shrink-0"
                    data-testid="new-video-title-input"
                  />
                  <Input
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="Paste Google Drive video link..."
                    className="flex-1"
                    data-testid="new-video-url-input"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const fileId = extractDriveFileId(newVideoUrl);
                      if (!fileId) {
                        toast.error('Invalid Google Drive link. Please paste a valid share URL.');
                        return;
                      }
                      const title = newVideoTitle.trim() || `Day ${driveVideos.length + 1}`;
                      setDriveVideos([...driveVideos, { title, drive_file_id: fileId }]);
                      setNewVideoUrl('');
                      setNewVideoTitle('');
                      toast.success(`Added: ${title}`);
                    }}
                    className="clay-button-primary flex-shrink-0"
                    data-testid="add-video-btn"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {formData.course_type === 'live' ? (
                <div>
                  <Label htmlFor="pricing_live">Monthly Price (₹)</Label>
                  <Input
                    id="pricing_live"
                    type="number"
                    step="0.01"
                    value={formData.pricing_live}
                    onChange={(e) => setFormData({ ...formData, pricing_live: e.target.value })}
                    placeholder="10000"
                    required
                    data-testid="course-live-price-input"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Students will be charged this amount monthly
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="pricing_recorded">One-time Price (₹)</Label>
                  <Input
                    id="pricing_recorded"
                    type="number"
                    step="0.01"
                    value={formData.pricing_recorded}
                    onChange={(e) => setFormData({ ...formData, pricing_recorded: e.target.value })}
                    placeholder="25000"
                    required
                    data-testid="course-recorded-price-input"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    One-time payment for lifetime access
                  </p>
                </div>
              )}
              <div>
                <Label>Course Thumbnail</Label>
                <div className="mt-2">
                  <label
                    htmlFor="course_thumbnail"
                    className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                    data-testid="course-thumbnail-upload-area"
                  >
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400" />
                    )}
                    <div>
                      <p className="text-sm font-outfit font-bold text-slate-700">
                        {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail image'}
                      </p>
                      <p className="text-xs text-slate-500 font-figtree">JPG, PNG, WebP — or pick a stock image below</p>
                    </div>
                  </label>
                  <input id="course_thumbnail" type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} data-testid="course-thumbnail-file-input" />
                </div>
                {stockImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 font-figtree mb-2">Or choose a stock image:</p>
                    <div className="grid grid-cols-5 gap-2" data-testid="stock-images-grid">
                      {stockImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={`${BACKEND_URL}${img}`}
                          alt={`Stock ${idx + 1}`}
                          className={`w-full h-16 object-cover rounded-lg cursor-pointer transition-all border-2 ${
                            formData.thumbnail === img ? 'border-blue-500 ring-2 ring-blue-300' : 'border-transparent hover:border-blue-300'
                          }`}
                          onClick={() => {
                            setFormData({ ...formData, thumbnail: img });
                            setThumbnailFile(null);
                            setThumbnailPreview(`${BACKEND_URL}${img}`);
                          }}
                          data-testid={`stock-image-${idx}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="syllabus">Syllabus (one item per line)</Label>
                <Textarea
                  id="syllabus"
                  value={formData.syllabus}
                  onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                  rows={6}
                  placeholder="Introduction to Agentic AI\nAWS Lex Fundamentals\nLambda Integration"
                  required
                  data-testid="course-syllabus-input"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 clay-button-primary" disabled={uploading} data-testid="save-course-btn">
                  {uploading ? 'Uploading...' : editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="clay-button-secondary"
                  data-testid="cancel-course-btn"
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

export default AdminCoursesManagement;