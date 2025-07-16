import React from 'react';
import { Shield } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <div className="bg-dark-900 py-4 px-6 border-b border-dark-600">
      <div className="max-w-8xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-primary-500">Arouzy</div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Admin Dashboard</span>
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;