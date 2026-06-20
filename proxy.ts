import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/lib/admin-auth";

function unauthorizedApiResponse() {
    return new NextResponse("Authentication required", {
        status: 401,
        headers: {
            "WWW-Authenticate": 'Basic realm="Bella Fashion Admin"',
        },
    });
}

function loginRedirect(request: NextRequest) {
    const loginUrl = new URL("/admin/login", request.url);
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method.toUpperCase();
    const isAdminLoginPath = pathname.startsWith("/admin/login");

    const isAdminPath = pathname.startsWith("/admin");
    const isProtectedProdutosMutation =
        pathname.startsWith("/api/produtos") && ["POST", "PUT", "DELETE"].includes(method);
    const isProtectedPedidosMutation =
        pathname.startsWith("/api/pedidos") && ["PUT", "DELETE"].includes(method);
    const isProtectedConfigMutation =
        pathname.startsWith("/api/configuracoes") && ["PUT", "POST", "DELETE", "PATCH"].includes(method);
    const isProtectedUploadMutation =
        pathname.startsWith("/api/upload") && ["POST", "PUT", "DELETE", "PATCH"].includes(method);
    const isProtectedApiMutation =
        isProtectedProdutosMutation ||
        isProtectedPedidosMutation ||
        isProtectedConfigMutation ||
        isProtectedUploadMutation;

    if (isAdminLoginPath) {
        return NextResponse.next();
    }

    if (!isAdminPath && !isProtectedApiMutation) {
        return NextResponse.next();
    }

    const isAuthenticated = await isAdminRequestAuthenticated(request);

    if (!isAuthenticated) {
        if (isAdminPath) {
            return loginRedirect(request);
        }

        return unauthorizedApiResponse();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/api/produtos/:path*",
        "/api/pedidos/:path*",
        "/api/configuracoes/:path*",
        "/api/upload/:path*",
    ],
};
