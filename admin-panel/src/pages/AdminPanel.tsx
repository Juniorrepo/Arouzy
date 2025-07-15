import React, { useState } from 'react';
import Layout from '../layouts/Layout';
import Sidebar from '../layouts/Sidebar';
import StatisticsPage from './StatisticsPage';
import DeleteUsersPage from './DeleteUsersPage';
import DeletePostsPage from './DeletePostsPage';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('statistics');

  const renderContent = () => {
    switch (activeTab) {
      case 'statistics':
        return <StatisticsPage />;
      case 'delete-users':
        return <DeleteUsersPage />;
      case 'delete-posts':
        return <DeletePostsPage />;
      default:
        return <StatisticsPage />;
    }
  };

  return (
    <Layout>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default AdminPanel;