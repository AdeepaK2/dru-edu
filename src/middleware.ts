import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /teacher/login, /admin/dashboard)
  const pathname = request.nextUrl.pathname;

  // Security headers for all responses
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Handle API routes security
  if (pathname.startsWith('/api/')) {
    // Add CORS headers for API routes
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }

    // Security checks for sensitive API routes
    if (pathname.startsWith('/api/stripe/')) {
      // Stripe API routes require authentication (except webhook)
      if (!pathname.includes('/webhook')) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
      }
      
      // Webhook endpoint requires Stripe signature
      if (pathname.includes('/webhook')) {
        const stripeSignature = request.headers.get('stripe-signature');
        if (!stripeSignature) {
          return NextResponse.json(
            { error: 'Missing Stripe signature' },
            { status: 400 }
          );
        }
      }
    }

    return response;
  }

  // Check if the path is a teacher route (but not login)
  if (pathname.startsWith('/teacher') && !pathname.startsWith('/teacher/login')) {
    // Here you would typically check for authentication
    // For now, we'll let the client-side handle the auth check
    return response;
  }

  // Check if the path is a student route (but not login or home)
  if (pathname.startsWith('/student') && 
      !pathname.startsWith('/student/login') && 
      pathname !== '/student') {
    // Let the client-side StudentAuthGuard handle the auth check
    return response;
  }

  return response;
}

// Configure paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
