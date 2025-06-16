'use client';

import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import { useEffect, useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:8080/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setRole(data.role);
        }
      } catch (err) {
        console.error('Failed to fetch role:', err);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');        // remove token
    deleteCookie('token');                   // optional, if also stored in cookie

    if (role === 'ADMIN') {
      router.push('/admin/login');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Logout
    </button>
  );
}
