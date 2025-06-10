import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-900 py-6 border-t border-dark-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap justify-center space-x-6 text-sm text-gray-400">
          <Link to="/feedback" className="hover:text-white transition-colors">
            Feedback
          </Link>
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <Link to="/dmca" className="hover:text-white transition-colors">
            DMCA/Abuse
          </Link>
          <Link to="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link to="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
          <Link to="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
        </div>
        <div className="mt-4 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Arouzy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;