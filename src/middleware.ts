import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Skip middleware entirely for public API routes
  const publicApiRoutes = ["/api/worker", "/api/auth", "/api/cities", "/api/offers"];
  const isPublicApiRoute = publicApiRoutes.some(
    (route) => request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/worker (worker endpoint needs to be public for cron)
     * - api/auth (auth callback)
     * - api/cities (public API)
     * - api/offers (public API)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/worker|api/auth|api/cities|api/offers|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

