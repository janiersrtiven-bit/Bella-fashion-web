import { NextRequest, NextResponse } from "next/server";

function unauthorizedResponse() {
    return new NextResponse("Authentication required", {
        status: 401,
        headers: {
            "WWW-Authenticate": 'Basic realm="Bella Fashion Admin"',
        },
    });
}

function isValidBasicAuth(authHeader: string | null) {
    const adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPassword) {
        // If credentials are missing, block protected routes by default.
        return false;
    }

    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return false;
    }

    const base64Credentials = authHeader.split(" ")[1] ?? "";
    const decoded = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const [user, password] = decoded.split(":");

    return user === adminUser && password === adminPassword;
}

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method.toUpperCase();

    const isAdminPath = pathname.startsWith("/admin");
    const isProtectedProdutosMutation =
        pathname.startsWith("/api/produtos") && ["POST", "PUT", "DELETE"].includes(method);
    const isProtectedPedidosMutation =
        pathname.startsWith("/api/pedidos") && ["PUT", "DELETE"].includes(method);
    const isProtectedApiMutation =
        isProtectedProdutosMutation || isProtectedPedidosMutation;

    if (!isAdminPath && !isProtectedApiMutation) {
        return NextResponse.next();
    }

    const authHeader = request.headers.get("authorization");
    if (isAdminPath) {
        if (!isValidBasicAuth(authHeader)) {
            return unauthorizedResponse();
        }

        return NextResponse.next();
    }

    if (isValidBasicAuth(authHeader)) {
        return NextResponse.next();
    }

    const referer = request.headers.get("referer") || "";
    const isAdminSameOriginRequest = referer.startsWith(`${request.nextUrl.origin}/admin`);

    if (!isAdminSameOriginRequest) {
        return unauthorizedResponse();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/produtos/:path*", "/api/pedidos/:path*"],
};
