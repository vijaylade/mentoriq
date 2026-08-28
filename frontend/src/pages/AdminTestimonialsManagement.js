import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Star, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTestimonialsManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    content: '',
    image_url: '',
    rating: 5,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/testimonials`);
      setTestimonials(data);
    } catch (error) {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      content: testimonial.content,
      image_url: testimonial.image_url,
      rating: testimonial.rating,
    });
    setImageFile(null);
    setImagePreview(testimonial.image_url?.startsWith('/api') ? `${BACKEND_URL}${testimonial.image_url}` : testimonial.image_url);
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditingTestimonial(null);
    setFormData({ name: '', role: '', content: '', image_url: '', rating: 5 });
    setImageFile(null);
    setImagePreview('');
    setShowDialog(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const { data } = await axios.post(`${BACKEND_URL}/api/upload/image`, fd, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = data.image_url;
      }

      const payload = { ...formData, image_url: imageUrl };

      if (editingTestimonial) {
        await axios.put(
          `${BACKEND_URL}/api/admin/testimonials/${editingTestimonial.id}`,
          payload,
          { withCredentials: true }
        );
        toast.success('Testimonial updated');
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/testimonials`, payload, {
          withCredentials: true,
        });
        toast.success('Testimonial created');
      }
      setShowDialog(false);
      setImageFile(null);
      fetchTestimonials();
    } catch (error) {
      toast.error('Failed to save testimonial');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/testimonials/${id}`, {
        withCredentials: true,
      });
      toast.success('Testimonial deleted');
      fetchTestimonials();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getImageSrc = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? `${BACKEND_URL}${url}` : url;
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
        <h2 className="text-2xl font-outfit font-bold text-slate-800">Testimonials</h2>
        <Button onClick={handleAdd} className="clay-button-primary" data-testid="add-testimonial-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Testimonial
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="clay-card p-6" data-testid={`testimonial-item-${testimonial.id}`}>
            <div className="flex items-start gap-4 mb-4">
              <img
                src={getImageSrc(testimonial.image_url)}
                alt={testimonial.name}
                className="w-16 h-16 rounded-full object-cover bg-slate-200"
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${testimonial.name}&background=random`; }}
              />
              <div className="flex-1">
                <h3 className="font-outfit font-bold text-slate-900">{testimonial.name}</h3>
                <p className="text-sm text-slate-600 font-figtree">{testimonial.role}</p>
                <div className="flex gap-1 mt-2">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-slate-700 font-figtree text-sm mb-4">{testimonial.content}</p>
            <div className="flex gap-2">
              <Button onClick={() => handleEdit(testimonial)} className="clay-button-secondary flex-1" data-testid={`edit-testimonial-${testimonial.id}`}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button onClick={() => handleDelete(testimonial.id)} className="clay-button-secondary text-red-600" data-testid={`delete-testimonial-${testimonial.id}`}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-outfit font-bold text-2xl">
              {editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="testimonial-name-input" />
            </div>
            <div>
              <Label htmlFor="role">Role/Position</Label>
              <Input id="role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required data-testid="testimonial-role-input" />
            </div>
            <div>
              <Label htmlFor="content">Testimonial Content</Label>
              <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} required data-testid="testimonial-content-input" />
            </div>
            <div>
              <Label>Photo</Label>
              <div className="mt-2">
                <label
                  htmlFor="testimonial_image"
                  className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                  data-testid="testimonial-image-upload-area"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400" />
                  )}
                  <div>
                    <p className="text-sm font-outfit font-bold text-slate-700">
                      {imageFile ? imageFile.name : 'Click to upload photo'}
                    </p>
                    <p className="text-xs text-slate-500 font-figtree">JPG, PNG, WebP</p>
                  </div>
                </label>
                <input id="testimonial_image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} data-testid="testimonial-image-file-input" />
              </div>
            </div>
            <div>
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input id="rating" type="number" min="1" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })} required data-testid="testimonial-rating-input" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 clay-button-primary" disabled={uploading} data-testid="save-testimonial-btn">
                {uploading ? 'Uploading...' : editingTestimonial ? 'Update' : 'Create'}
              </Button>
              <Button type="button" onClick={() => setShowDialog(false)} className="clay-button-secondary">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestimonialsManagement;
