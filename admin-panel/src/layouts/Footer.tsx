import React from 'react';

const Footer: React.FC = () => {
  const footerLinks = [
    { label: 'Feedback', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'DMCA/Abuse', href: '#' },
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'FAQ', href: '#' }
  ];

  return (
    <footer className="bg-dark-900 border-t border-gray-800 px-6 py-4 mt-auto">
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
        {footerLinks.map((link, index) => (
          <React.Fragment key={link.label}>
            <a 
              href={link.href} 
              className="hover:text-purple-400 transition-colors"
            >
              {link.label}
            </a>
            {index < footerLinks.length - 1 && (
              <span className="text-gray-600">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="text-center text-xs text-gray-500 mt-2">
        © 2024 Arouzy. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;