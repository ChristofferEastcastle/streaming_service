'use client'; // This component needs to be a Client Component to handle state for dark mode and current path

import './globals.css';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // Hook to get the current path

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname(); // Get the current path

  useEffect(() => {
    // Check local storage for dark mode preference on mount
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      if (newMode) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
      }
      return newMode;
    });
  };

  return (
      <>
        <head>
          <title>VividFlow</title>
        </head>
        {/* The dark-mode class is now directly applied to the body based on state */}
        <body className={darkMode ? 'dark-mode' : ''}>
        <nav className="navbar">
          <div className="navbar-logo">Vivid<span className="navbar-logo-text-primary">Flow</span></div>
          <div className="navbar-links">
            {/* Use pathname to apply 'active' class */}
            <a href="/" className={`navbar-link ${pathname === '/' ? 'active' : ''}`}>Home</a>
            <a href="/browse" className={`navbar-link ${pathname === '/browse' ? 'active' : ''}`}>Browse</a>
            <button onClick={toggleDarkMode} className="dark-mode-toggle" aria-label="Toggle dark mode">
              {darkMode ? (
                  // Sun icon for light mode
                  <svg className="dark-mode-toggle-icon" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 00-1.414-1.414L13.536 3.536a1 1 0 001.414 1.414l.707-.707zm-9.193 9.193a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zm-.707-1.414a1 1 0 001.414-1.414L5.536 4.536a1 1 0 00-1.414 1.414l.707.707zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1z"></path>
                  </svg>
              ) : (
                  // Moon icon for dark mode
                  <svg className="dark-mode-toggle-icon" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                  </svg>
              )}
            </button>
          </div>
        </nav>
        {children}
        </body>
      </>
  )
}
