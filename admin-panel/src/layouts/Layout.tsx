import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark-800 text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default Layout;