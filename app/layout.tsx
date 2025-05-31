"use client";

import './globals.css';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // Hook to get the current path

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  const pathname = usePathname(); // Get the current path

  return (
      <>
        <head>
          <title>VividFlow</title>
        </head>
        <body>
        <nav className="navbar">
          <div className="navbar-logo">Vivid<span className="navbar-logo-text-primary">Flow</span></div>
          <div className="navbar-links">
            {/* Use pathname to apply 'active' class */}
            <a href="/" className={`navbar-link ${pathname === '/' ? 'active' : ''}`}>Home</a>
            <a href="/browse" className={`navbar-link ${pathname === '/browse' ? 'active' : ''}`}>Browse</a>
          </div>
        </nav>
        {children}
        </body>
      </>
  )
}
