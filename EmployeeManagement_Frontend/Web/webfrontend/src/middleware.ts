import { NextRequest, NextResponse } from 'next/server';

const AUTH_URL = 'http://localhost:8080/auth/me';

async function getUserRole(token: string): Promise<string | null> {
  try {
    const res = await fetch(AUTH_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials:"include"
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.role || null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  const loginPaths = {
    '/admin/login': 'ADMIN',
    '/auth/login': ['HR', 'EMPLOYEE'],
  };

  if (pathname === '/admin/login' || pathname === '/auth/login') {
    if (token) {
      const role = await getUserRole(token);
      if (role) {
        if (role === 'ADMIN' && pathname === '/admin/login') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else if (role === 'HR' && pathname === '/auth/login') {
          return NextResponse.redirect(new URL('/hr/dashboard', request.url));
        } else if (role === 'EMPLOYEE' && pathname === '/auth/login') {
          return NextResponse.redirect(new URL('/employee/dashboard', request.url));
        }
      }
    }
    return NextResponse.next();
  }

  const protectedPaths = [
    { prefix: '/admin', role: 'ADMIN', login: '/admin/login' },
    { prefix: '/hr', role: 'HR', login: '/auth/login' },
    { prefix: '/employee', role: 'EMPLOYEE', login: '/auth/login' },
  ];

  for (const { prefix, role, login } of protectedPaths) {
    if (pathname.startsWith(prefix)) {
      if (!token) {
        return NextResponse.redirect(new URL(login, request.url));
      }

      const userRole = await getUserRole(token);
      if (!userRole) {
        return NextResponse.redirect(new URL(login, request.url));
      }

      if (userRole !== role) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/hr/:path*',
    '/employee/:path*',
    '/admin/login',
    '/auth/login',
  ],
};
