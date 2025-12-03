import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for Chameleon AI Chat - Local-First Edition
 * All auth has been removed for single-user desktop app mode.
 * Simply passes all requests through without authentication checks.
 */
export async function middleware(request: NextRequest) {
  // No authentication - single user local app
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ],
}
