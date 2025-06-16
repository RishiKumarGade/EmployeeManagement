import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  if (pathname === '/admin/login' || pathname === '/auth/login') {
    if (token) {
      try {
        const res = await fetch('http://localhost:8080/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.role === 'ADMIN' && pathname === '/admin/login') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
          } else if (data.role === 'HR' && pathname === '/auth/login') {
            return NextResponse.redirect(new URL('/hr/dashboard', request.url));
          } else if (data.role === 'EMPLOYEE' && pathname === '/auth/login') {
            return NextResponse.redirect(new URL('/employee/dashboard', request.url));
          }
        }
      } catch {
      }
    }
    return NextResponse.next();
  }

  const protectedPaths = [
    { prefix: '/admin', role: 'ADMIN', loginRedirect: '/admin/login' },
    { prefix: '/hr', role: 'HR', loginRedirect: '/auth/login' },
    { prefix: '/employee', role: 'EMPLOYEE', loginRedirect: '/auth/login' },
  ];

  for (const route of protectedPaths) {
    if (pathname.startsWith(route.prefix)) {
      if (!token) {
        request.cookies.set('token','');
        return NextResponse.redirect(new URL(route.loginRedirect, request.url));
      }

      try {
        const res = await fetch('http://localhost:8080/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {

          return NextResponse.redirect(new URL(route.loginRedirect, request.url));
        }

        const data = await res.json();
        if (data.role !== route.role) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      } catch {
        return NextResponse.redirect(new URL(route.loginRedirect, request.url));
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
