import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const locales = ['en', 'bn'];
const defaultLocale = 'en';

const getSecretKey = () => new TextEncoder().encode(process.env.AUTH_SECRET || '');

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if pathname starts with a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  const token = request.cookies.get('drmc_session')?.value;
  
  if (pathnameHasLocale) {
    const match = pathname.match(/^\/(en|bn)\//);
    const lang = match ? match[1] : 'en';

    // Proxy checks authentication; server layouts/pages use the current DB role.
    const area = pathname.split('/')[2];
    if (area && ['admin', 'organizer', 'me', 'registrations'].includes(area)) {
      if (!token) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = `/${lang}/login`;
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      try {
        await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
      } catch {
        // Invalid token
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = `/${lang}/login`;
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }
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
