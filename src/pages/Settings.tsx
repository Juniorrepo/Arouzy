import React, { useState, useEffect } from "react";
import { Star, User, Eye, Bell, FileText, Trash2, Menu, X } from 'lucide-react';

interface SettingsMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

interface DashboardCard {
  title: string;
  value: string | number;
  description?: string;
}

const settingsMenuItems: SettingsMenuItem[] = [
  { id: 'account', label: 'Account details', icon: <Star size={16} />, active: true },
  { id: 'notifications', label: 'Notification settings', icon: <Bell size={16} /> },
  { id: 'content', label: 'Manage your content', icon: <FileText size={16} /> },
  { id: 'delete', label: 'Delete your account', icon: <Trash2 size={16} /> },
];

const dashboardCards: DashboardCard[] = [
  { title: 'Your content', value: 5 },
  { title: 'Your collections', value: 3 },
  { title: 'Your email address', value: 'test2@gmail.com' },
  { title: 'Your account status', value: 'Free' },
];

const Settings : React.FC = () => {
const [activeMenuItem, setActiveMenuItem] = useState('account');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className={`lg:w-80 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-black/60 rounded-lg   p-6">
              <nav className="space-y-2">
                {settingsMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveMenuItem(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeMenuItem === item.id
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Username</h2>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboardCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-black/60 rounded-lg   p-6 hover:border-gray-600 transition-colors"
                >
                  <h3 className="text-sm text-gray-400 mb-2">{card.title}</h3>
                  <div className="text-4xl font-bold text-white">
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Account Details Form */}
            {activeMenuItem === 'account' && (
              <div className="mt-8 bg-black/60 rounded-lg   p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Account Information</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      defaultValue="Username"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue="test2@gmail.com"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Account Status
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm border border-green-600/30">
                        Free
                      </span>
                      <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                        Upgrade to Premium
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex gap-4">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Save Changes
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeMenuItem === 'notifications' && (
              <div className="mt-8 bg-black/60 rounded-lg   p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    'Email notifications for new content',
                    'Push notifications for live streams',
                    'Weekly summary emails',
                    'Marketing communications'
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-300">{setting}</span>
                      <input
                        type="checkbox"
                        defaultChecked={index < 2}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Management */}
            {activeMenuItem === 'content' && (
              <div className="mt-8 bg-black/60 rounded-lg   p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Content Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Your Uploads</h4>
                      <p className="text-gray-400 text-sm">Manage your uploaded content</p>
                    </div>
                    <button className="text-purple-400 hover:text-purple-300 transition-colors">
                      View All
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium">Collections</h4>
                      <p className="text-gray-400 text-sm">Organize your favorite content</p>
                    </div>
                    <button className="text-purple-400 hover:text-purple-300 transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;