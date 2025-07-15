import React from 'react';
import { Shield } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-purple-400">Arouzy</div>
          <div className="text-sm text-gray-400">Admin Panel</div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Admin Dashboard</span>
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;