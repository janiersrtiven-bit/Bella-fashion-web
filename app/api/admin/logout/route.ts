import { NextResponse } from "next/server";
import { getAdminSessionCookieName } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
    const response = NextResponse.json({ success: true });

    response.cookies.set({
        name: getAdminSessionCookieName(),
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return response;
}

export async function GET(request: Request) {
    const redirectUrl = new URL("/admin/login", request.url);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set({
        name: getAdminSessionCookieName(),
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return response;
}
