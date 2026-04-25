import { NextRequest, NextResponse } from 'next/server';

// Device detection: route mobile users to /m, desktop to /
// Mobile gets the boot sequence + mobile-optimized experience.
// Desktop gets the full landing.
//
// Override: ?desktop=1 or ?mobile=1 forces a view (sticky for the session via cookie).

const MOBILE_REGEX = /Mobile|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Don't run on API, static, or already-routed paths
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/m') ||
    pathname.includes('.') // static files (.html, .png, .ico, etc.)
  ) {
    return NextResponse.next();
  }

  // Manual override
  const force = searchParams.get('desktop') ? 'desktop'
              : searchParams.get('mobile') ? 'mobile'
              : null;
  if (force) {
    const res = pathname === '/' && force === 'mobile'
      ? NextResponse.redirect(new URL('/m', req.url))
      : NextResponse.next();
    res.cookies.set('ug_view', force, { maxAge: 60 * 60 * 24 * 7, path: '/' });
    return res;
  }

  // Sticky cookie wins over UA detection
  const cookie = req.cookies.get('ug_view')?.value;
  const ua = req.headers.get('user-agent') || '';
  const isMobile = cookie === 'mobile' || (cookie !== 'desktop' && MOBILE_REGEX.test(ua));

  // Only redirect on the root — don't intercept other paths
  if (pathname === '/' && isMobile) {
    return NextResponse.redirect(new URL('/m', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
