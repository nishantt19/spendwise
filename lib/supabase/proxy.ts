import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/password-reset-sent",
  "/auth/reset-password",
];

// Routes accessible to authenticated but unverified users
const UNVERIFIED_ALLOWED_ROUTES = [
  "/auth/verify-email",
  "/auth/confirm",
  "/auth/callback",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  );

  // IMPORTANT: getClaims() automatically refreshes expired sessions
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isUnverifiedAllowedRoute = UNVERIFIED_ALLOWED_ROUTES.includes(pathname);
  const isAuthRoute = pathname.startsWith("/auth");

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (
    user &&
    authUser &&
    !authUser.email_confirmed_at &&
    !isUnverifiedAllowedRoute
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/verify-email";
    url.searchParams.set("email", authUser.email || "");
    return NextResponse.redirect(url);
  }

  if (user && authUser?.email_confirmed_at && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
