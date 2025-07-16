import React from 'react';
import { Users, Eye, User, FileText, Shield } from 'lucide-react';
import StatCard from '../components/StatCard';
import { mockStatistics } from '../services/mockData';

const StatisticsPage: React.FC = () => {
  const statistics = mockStatistics;

  return (
    <div className="space-y-6 ">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={statistics.totalUsers}
          icon={Users}
          iconColor="text-gray-400"
        />
        
        <StatCard
          title="Active Users (30 days)"
          value={statistics.activeUsers30Days}
          icon={Eye}
          iconColor="text-gray-400"
        />
        
        <StatCard
          title="New Signups (30 days)"
          value={statistics.newSignups30Days}
          icon={User}
          iconColor="text-gray-400"
        />
        
        <StatCard
          title="Total Threads"
          value={statistics.totalThreads}
          icon={FileText}
          iconColor="text-gray-400"
        />
        
        <StatCard
          title="Total Posts"
          value={statistics.totalPosts}
          icon={FileText}
          iconColor="text-gray-400"
        />
        
        <StatCard
          title="Pending Moderation"
          value={statistics.pendingModeration}
          icon={Shield}
          iconColor="text-gray-400"
        />
      </div>
      
      <div className="bg-dark-500 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Activity Overview</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">User Engagement Rate</span>
            <span className="text-green-400">21.6%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Daily Active Users</span>
            <span className="text-white">1,247</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Average Session Duration</span>
            <span className="text-white">8m 32s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;