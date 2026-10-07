import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'bn'];
const defaultLocale = 'en';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname starts with a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  const hasSession = request.cookies.has('drmc_session');
  
  if (pathnameHasLocale) {
    // Fast-path redirect for protected routes
    const isProtectedRoute = /^\/(en|bn)\/(admin|me|registrations)(\/|$)/.test(pathname);
    if (isProtectedRoute && !hasSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${pathname.split('/')[1]}/login`;
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Exclude api, _next, static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Determine locale from cookie or accept-language
  let locale = defaultLocale;
  const cookieLocale = request.cookies.get('lang')?.value;

  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
      if (acceptLanguage.includes('bn')) {
        locale = 'bn';
      } else if (acceptLanguage.includes('en')) {
        locale = 'en';
      }
    }
  }

  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|brand|.*\\.).*)',
  ],
};
