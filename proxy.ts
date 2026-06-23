import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const isLoginPage = pathname === "/admin/login";
    const isAuthenticated = await isAdminRequestAuthenticated(request);

    if (!isAuthenticated && !isLoginPage) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthenticated && isLoginPage) {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin", "/admin/:path*"],
};
