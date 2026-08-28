import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users, BookOpen, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import AdminCoursesManagement from './AdminCoursesManagement';
import AdminTestimonialsManagement from './AdminTestimonialsManagement';
import AdminBlogManagement from './AdminBlogManagement';
import AdminUsersManagement from './AdminUsersManagement';
import AdminPurchases from './AdminPurchases';
import AdminEnrollments from './AdminEnrollments';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/admin/stats`, { withCredentials: true });
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
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
            Admin Dashboard
          </h1>
          <p className="text-lg font-figtree text-slate-600">
            Platform overview and management
          </p>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="clay-card p-2 flex-wrap">
            <TabsTrigger value="overview" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-courses">
              Courses
            </TabsTrigger>
            <TabsTrigger value="purchases" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-purchases">
              Purchases
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-enrollments">
              Enrollments
            </TabsTrigger>
            <TabsTrigger value="users" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-users">
              Users
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-testimonials">
              Testimonials
            </TabsTrigger>
            <TabsTrigger value="blogs" className="font-outfit font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white" data-testid="tab-blogs">
              Blog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="clay-card p-8">
                  <Users className="w-10 h-10 text-blue-600 mb-4" />
                  <p className="text-3xl font-outfit font-black text-slate-900 mb-1" data-testid="stat-users">
                    {stats.total_users}
                  </p>
                  <p className="text-sm font-figtree text-slate-600">Total Users</p>
                </div>
                <div className="clay-card p-8">
                  <BookOpen className="w-10 h-10 text-blue-600 mb-4" />
                  <p className="text-3xl font-outfit font-black text-slate-900 mb-1" data-testid="stat-courses">
                    {stats.total_courses}
                  </p>
                  <p className="text-sm font-figtree text-slate-600">Total Courses</p>
                </div>
                <div className="clay-card p-8">
                  <TrendingUp className="w-10 h-10 text-blue-600 mb-4" />
                  <p className="text-3xl font-outfit font-black text-slate-900 mb-1" data-testid="stat-enrollments">
                    {stats.total_enrollments}
                  </p>
                  <p className="text-sm font-figtree text-slate-600">Enrollments</p>
                </div>
                <div className="clay-card p-8">
                  <DollarSign className="w-10 h-10 text-green-600 mb-4" />
                  <p className="text-3xl font-outfit font-black text-slate-900 mb-1" data-testid="stat-revenue">
                    ₹{stats.total_revenue.toFixed(2)}
                  </p>
                  <p className="text-sm font-figtree text-slate-600">Total Revenue</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="courses">
            <AdminCoursesManagement />
          </TabsContent>

          <TabsContent value="purchases">
            <AdminPurchases />
          </TabsContent>

          <TabsContent value="enrollments">
            <AdminEnrollments />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersManagement />
          </TabsContent>

          <TabsContent value="testimonials">
            <AdminTestimonialsManagement />
          </TabsContent>

          <TabsContent value="blogs">
            <AdminBlogManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
