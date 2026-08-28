import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart, IndianRupee } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/admin/purchases`, { withCredentials: true });
      setPurchases(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div className="clay-card p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-outfit font-bold text-slate-800">Purchase History</h2>
            <p className="text-sm text-slate-600 font-figtree mt-1">
              Track which students purchased which courses and payment amounts
            </p>
          </div>
          <div className="clay-card p-4 bg-green-50">
            <p className="text-xs font-outfit text-green-700 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-outfit font-black text-green-700" data-testid="purchases-total-revenue">
              ₹{totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-figtree text-slate-600">No purchases yet</p>
            <p className="text-sm text-slate-500 font-figtree">Purchase records will appear here once students enroll in courses</p>
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
                  <th className="text-right py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Amount</th>
                  <th className="text-left py-3 px-4 font-outfit font-bold text-slate-700 text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase, idx) => (
                  <tr key={purchase.order_id || idx} className="border-b border-slate-100" data-testid={`purchase-row-${idx}`}>
                    <td className="py-3 px-4 font-figtree text-slate-700 font-medium">
                      {purchase.user_name}
                    </td>
                    <td className="py-3 px-4 font-figtree text-slate-600 text-sm">
                      {purchase.user_email}
                    </td>
                    <td className="py-3 px-4 font-figtree text-slate-700">
                      {purchase.course_title}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-outfit font-bold ${
                        purchase.enrollment_type === 'live'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {purchase.enrollment_type === 'live' ? 'LIVE' : 'RECORDED'}
                      </span>
                      {purchase.is_subscription && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-outfit font-bold">
                          Subscription
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-outfit font-bold text-slate-900">
                      ₹{purchase.amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-figtree text-slate-600 text-sm">
                      {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPurchases;
