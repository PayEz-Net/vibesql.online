'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#tracks', label: 'Tracks' },
    { href: '#prizes', label: 'Prizes' },
    { href: '#register', label: 'Register' },
    { href: '#schedule', label: 'Schedule' },
    { href: '#rules', label: 'Rules' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="navBodyGrad" x1="116" y1="0" x2="396" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.4"/>
                  <stop offset="50%" stopColor="#2563EB" stopOpacity="0"/>
                  <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.3"/>
                </linearGradient>
              </defs>
              <ellipse cx="256" cy="400" rx="140" ry="40" fill="#1e3a5f"/>
              <rect x="116" y="160" width="280" height="240" fill="#2563EB"/>
              <rect x="116" y="160" width="280" height="240" fill="url(#navBodyGrad)"/>
              <ellipse cx="256" cy="400" rx="140" ry="40" fill="#1e4f8a"/>
              <ellipse cx="256" cy="160" rx="140" ry="40" fill="#3b82f6"/>
              <ellipse cx="256" cy="152" rx="100" ry="22" fill="#60a5fa" opacity="0.3"/>
            </svg>
            <span className="font-bold text-white">Vibe<span className="text-blue-400">SQL</span></span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-4 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-slate-300 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
