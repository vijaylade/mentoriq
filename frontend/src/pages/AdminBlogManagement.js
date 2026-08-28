import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, FileText, Upload, Link as LinkIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminBlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    excerpt: '',
    tags: '',
    read_time: '5 min read',
    read_more_link: '',
  });
  const [pdfFile, setPdfFile] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/blogs`);
      setBlogs(data);
    } catch (error) {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      category: '',
      excerpt: '',
      tags: '',
      read_time: '5 min read',
      read_more_link: '',
    });
    setPdfFile(null);
    setShowDialog(true);
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      category: blog.category,
      excerpt: blog.excerpt,
      tags: blog.tags?.join(', ') || '',
      read_time: blog.read_time || '5 min read',
      read_more_link: blog.read_more_link || '',
    });
    setPdfFile(null);
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('category', formData.category);
      fd.append('excerpt', formData.excerpt);
      fd.append('tags', formData.tags);
      fd.append('read_time', formData.read_time);
      fd.append('read_more_link', formData.read_more_link);
      if (pdfFile) {
        fd.append('pdf_file', pdfFile);
      }

      if (editingBlog) {
        await axios.put(`${BACKEND_URL}/api/admin/blogs/${editingBlog.id}`, fd, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Blog updated successfully');
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/blogs`, fd, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Blog created successfully');
      }

      setShowDialog(false);
      setPdfFile(null);
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to save blog');
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/blogs/${blogId}`, {
        withCredentials: true,
      });
      toast.success('Blog deleted successfully');
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to delete blog');
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-outfit font-bold text-slate-800">Blog Articles</h2>
          <p className="text-sm text-slate-600 font-figtree mt-1">
            Manage blog posts on the landing page. Attach PDFs or links for "Read More".
          </p>
        </div>
        <Button onClick={handleAdd} className="clay-button-primary" data-testid="add-blog-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Blog Article
        </Button>
      </div>

      {blogs.length === 0 ? (
        <div className="clay-card p-12 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-figtree text-slate-600 mb-4">No blog articles yet</p>
          <Button onClick={handleAdd} className="clay-button-primary" data-testid="add-first-blog-btn">
            Create Your First Blog Article
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.map((blog) => (
            <div key={blog.id} className="clay-card p-6" data-testid={`blog-item-${blog.id}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-outfit font-bold">
                      {blog.category}
                    </span>
                    <span className="text-xs text-slate-500 font-figtree">{blog.read_time}</span>
                    {blog.pdf_filename && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-outfit font-bold flex items-center gap-1">
                        <FileText className="w-3 h-3" /> PDF
                      </span>
                    )}
                    {blog.read_more_link && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-outfit font-bold flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Link
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-outfit font-bold text-slate-900 mb-2">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-figtree line-clamp-2 mb-2">
                    {blog.excerpt}
                  </p>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-figtree">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {blog.pdf_filename && (
                    <a href={`${BACKEND_URL}/api/blogs/${blog.id}/pdf`} target="_blank" rel="noopener noreferrer">
                      <Button className="clay-button-secondary" data-testid={`view-pdf-${blog.id}`}>
                        <FileText className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  {blog.read_more_link && (
                    <a href={blog.read_more_link} target="_blank" rel="noopener noreferrer">
                      <Button className="clay-button-secondary" data-testid={`view-link-${blog.id}`}>
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Button
                    onClick={() => handleEdit(blog)}
                    className="clay-button-secondary"
                    data-testid={`edit-blog-${blog.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(blog.id)}
                    className="clay-button-secondary text-red-600"
                    data-testid={`delete-blog-${blog.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-outfit font-bold text-2xl">
              {editingBlog ? 'Edit Blog Article' : 'Add New Blog Article'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="blog_title">Title</Label>
              <Input
                id="blog_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What is Agentic AI?"
                required
                data-testid="blog-title-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="blog_category">Category</Label>
                <Input
                  id="blog_category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Fundamentals"
                  required
                  data-testid="blog-category-input"
                />
              </div>
              <div>
                <Label htmlFor="blog_read_time">Read Time</Label>
                <Input
                  id="blog_read_time"
                  value={formData.read_time}
                  onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                  placeholder="5 min read"
                  data-testid="blog-readtime-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="blog_excerpt">Content / Excerpt</Label>
              <Textarea
                id="blog_excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={5}
                placeholder="Brief description of the blog article..."
                required
                data-testid="blog-excerpt-input"
              />
            </div>
            <div>
              <Label htmlFor="blog_tags">Tags (comma separated)</Label>
              <Input
                id="blog_tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="AI Basics, Automation, Tutorial"
                data-testid="blog-tags-input"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-4">
              <p className="text-sm font-outfit font-bold text-slate-700">Read More Resource (PDF or Link)</p>
              <div>
                <Label htmlFor="blog_read_more_link">External URL Link</Label>
                <Input
                  id="blog_read_more_link"
                  type="url"
                  value={formData.read_more_link}
                  onChange={(e) => setFormData({ ...formData, read_more_link: e.target.value })}
                  placeholder="https://example.com/article"
                  data-testid="blog-link-input"
                />
                <p className="text-xs text-slate-500 font-figtree mt-1">
                  "Read More" will open this link. You can also upload a PDF below.
                </p>
              </div>
              <div>
                <Label htmlFor="blog_pdf">Or Upload a PDF</Label>
                <div className="mt-2">
                  <label
                    htmlFor="blog_pdf"
                    className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                    data-testid="blog-pdf-upload-area"
                  >
                    <Upload className="w-6 h-6 text-slate-400" />
                    <div>
                      <p className="text-sm font-outfit font-bold text-slate-700">
                        {pdfFile ? pdfFile.name : 'Click to upload PDF'}
                      </p>
                      <p className="text-xs text-slate-500 font-figtree">
                        {editingBlog?.pdf_filename
                          ? 'A PDF is already attached. Upload a new one to replace it.'
                          : 'Upload a PDF document for the "Read More" link'}
                      </p>
                    </div>
                  </label>
                  <input
                    id="blog_pdf"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    data-testid="blog-pdf-file-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 clay-button-primary" data-testid="save-blog-btn">
                {editingBlog ? 'Update Article' : 'Create Article'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowDialog(false)}
                className="clay-button-secondary"
                data-testid="cancel-blog-btn"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogManagement;
