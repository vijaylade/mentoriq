import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminUsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/admin/users`, { withCredentials: true });
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/admin/users`, formData, { withCredentials: true });
      toast.success('User created successfully');
      setShowDialog(false);
      setFormData({ name: '', email: '', password: '', role: 'student' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/users/${userId}`, { withCredentials: true });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
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
          <h2 className="text-2xl font-outfit font-bold text-slate-800">Users</h2>
          <Button
            onClick={() => setShowDialog(true)}
            className="clay-button-primary"
            data-testid="create-user-btn"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Create User
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Name</th>
                <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Email</th>
                <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Role</th>
                <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Created At</th>
                <th className="text-right py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100" data-testid={`user-row-${u.id}`}>
                  <td className="py-3 px-4 font-figtree text-slate-700">{u.name}</td>
                  <td className="py-3 px-4 font-figtree text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-outfit font-bold ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : u.role === 'teacher'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-figtree text-slate-600 text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      onClick={() => handleDelete(u.id, u.name)}
                      className="clay-button-secondary text-red-600 h-8 w-8 p-0"
                      data-testid={`delete-user-${u.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-outfit font-bold text-2xl">Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="user_name">Full Name</Label>
              <Input
                id="user_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                data-testid="create-user-name-input"
              />
            </div>
            <div>
              <Label htmlFor="user_email">Email</Label>
              <Input
                id="user_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
                data-testid="create-user-email-input"
              />
            </div>
            <div>
              <Label htmlFor="user_password">Password</Label>
              <Input
                id="user_password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required
                data-testid="create-user-password-input"
              />
            </div>
            <div>
              <Label htmlFor="user_role">Role</Label>
              <select
                id="user_role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2 font-figtree h-9"
                required
                data-testid="create-user-role-select"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 clay-button-primary" data-testid="submit-create-user-btn">
                Create User
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

export default AdminUsersManagement;
