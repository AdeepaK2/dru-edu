import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /teacher/login, /admin/dashboard)
  const pathname = request.nextUrl.pathname;

  // Check if the path is a teacher route (but not login)
  if (pathname.startsWith('/teacher') && !pathname.startsWith('/teacher/login')) {
    // Here you would typically check for authentication
    // For now, we'll let the client-side handle the auth check
    return NextResponse.next();
  }

  // Check if the path is a student route (but not login or home)
  if (pathname.startsWith('/student') && 
      !pathname.startsWith('/student/login') && 
      pathname !== '/student') {
    // Let the client-side StudentAuthGuard handle the auth check
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
