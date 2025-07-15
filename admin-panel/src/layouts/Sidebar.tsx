import React from 'react';
import { BarChart3, Users, FileText } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    {
      id: 'statistics',
      label: 'View statistics',
      icon: BarChart3
    },
    {
      id: 'delete-users',
      label: 'Delete users',
      icon: Users
    },
    {
      id: 'delete-posts',
      label: 'Delete posts',
      icon: FileText
    }
  ];

  return (
    <div className="w-64 bg-black border-r border-gray-800 h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;