'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => document.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white dark:bg-gray-800 shadow-md py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="font-heading text-xl font-bold text-primary-700 dark:text-primary-400">Dr. U Education</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`font-medium transition-colors ${
                isActive('/') 
                  ? 'text-primary-700 dark:text-primary-400' 
                  : 'text-secondary-600 dark:text-secondary-300 hover:text-primary-700 dark:hover:text-primary-400'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/courses" 
              className={`font-medium transition-colors ${
                isActive('/courses') 
                  ? 'text-primary-700 dark:text-primary-400' 
                  : 'text-secondary-600 dark:text-secondary-300 hover:text-primary-700 dark:hover:text-primary-400'
              }`}
            >
              Courses
            </Link>
            <Link 
              href="/about" 
              className={`font-medium transition-colors ${
                isActive('/about') 
                  ? 'text-primary-700 dark:text-primary-400' 
                  : 'text-secondary-600 dark:text-secondary-300 hover:text-primary-700 dark:hover:text-primary-400'
              }`}
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className={`font-medium transition-colors ${
                isActive('/contact') 
                  ? 'text-primary-700 dark:text-primary-400' 
                  : 'text-secondary-600 dark:text-secondary-300 hover:text-primary-700 dark:hover:text-primary-400'
              }`}
            >
              Contact
            </Link>
            <Link 
              href="/admin/login" 
              className="btn-primary"
            >
              Login
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-secondary-600 dark:text-secondary-300 hover:text-primary-700 dark:hover:text-primary-400 focus:outline-none"
            >              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="container mx-auto px-6 py-4 space-y-4">
          <Link
            href="/"
            className={`block py-2 px-4 rounded-md ${
              isActive('/') 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400' 
                : 'text-secondary-600 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/courses"
            className={`block py-2 px-4 rounded-md ${
              isActive('/courses') 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400' 
                : 'text-secondary-600 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setIsOpen(false)}
          >
            Courses
          </Link>
          <Link
            href="/about"
            className={`block py-2 px-4 rounded-md ${
              isActive('/about') 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400' 
                : 'text-secondary-600 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`block py-2 px-4 rounded-md ${
              isActive('/contact') 
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400' 
                : 'text-secondary-600 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => setIsOpen(false)}
          >
            Contact
          </Link>
          <Link
            href="/admin/login"
            className="block w-full py-2 px-4 rounded-md bg-primary-600 text-white text-center font-medium"
            onClick={() => setIsOpen(false)}
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
