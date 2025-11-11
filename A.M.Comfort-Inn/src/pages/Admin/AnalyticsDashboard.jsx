import React, { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
      </div>
      <div className="text-4xl" style={{ color }}>
        {icon}
      </div>
    </div>
  </div>
);

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [topRooms, setTopRooms] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [analyticsData, revenueData, occupancyData, topRoomsData] = await Promise.all([
          adminApi.getAnalytics(period),
          adminApi.getRevenue(period),
          adminApi.getOccupancyStats(),
          adminApi.getTopRoomTypes(),
        ]);

        if (analyticsData.success) setAnalytics(analyticsData.data);
        if (revenueData.success) setRevenue(revenueData.data);
        if (occupancyData.success) setOccupancy(occupancyData.data);
        if (topRoomsData.success) setTopRooms(topRoomsData.data);
      } catch (err) {
        toast.error(`Error loading analytics: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-600">Loading analytics...</div>;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₹${analytics?.totalRevenue?.toLocaleString() || '0'}`}
          icon="💰"
          color="#10b981"
        />
        <StatCard
          title="Total Bookings"
          value={analytics?.totalBookings || '0'}
          icon="📅"
          color="#3b82f6"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${typeof occupancy?.occupancyRate === 'number' ? occupancy.occupancyRate.toFixed(1) : occupancy?.occupancyRate || '0'}%`}
          icon="🏨"
          color="#f59e0b"
        />
        <StatCard
          title="Avg. Rating"
          value={`${analytics?.averageRating?.toFixed(1) || '0'}/5`}
          icon="⭐"
          color="#ef4444"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        {revenue?.chartData && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenue.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Room Types */}
        {topRooms && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Room Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRooms}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="roomType" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Occupancy Breakdown */}
        {occupancy?.data && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Occupancy Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupancy.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {occupancy.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Booking Status */}
        {analytics?.bookingsByStatus && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Booking Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(analytics.bookingsByStatus).map(([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.keys(analytics.bookingsByStatus).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Period Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Successful Bookings</p>
            <p className="text-2xl font-bold text-green-600">{analytics?.successfulBookings || '0'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Failed Bookings</p>
            <p className="text-2xl font-bold text-red-600">{analytics?.failedBookings || '0'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Pending Bookings</p>
            <p className="text-2xl font-bold text-yellow-600">{analytics?.pendingBookings || '0'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Refunded Bookings</p>
            <p className="text-2xl font-bold text-blue-600">{analytics?.refundedBookings || '0'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
