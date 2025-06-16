'use client';
import React, { useEffect, useState } from 'react';
import LogoutButton from './LogoutButton';
import axios from 'axios';
import { usePathname } from 'next/navigation';

function NavBar() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const pathname = usePathname();

  // Define paths where NavBar should be hidden
  const hideNav = pathname === "/auth/login" || pathname === "/admin/login";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
        setUser(null);
      }
    };

    if (!hideNav) {
      fetchUser();
    }
  }, [hideNav, pathname]); // Re-run when route changes

  // Don't render NavBar on login pages
  if (hideNav) return null;

  return (
    <nav className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold">EMS</h1>
          <div className="flex items-center space-x-4">
            {user ? (
              <span>Welcome, {user.name} ({user.role})</span>
            ) : (
              <span>Loading user...</span>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
