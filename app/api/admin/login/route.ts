import { NextResponse } from "next/server";
import {
    createAdminSessionToken,
    getAdminSessionCookieName,
    getAdminSessionMaxAgeSeconds,
    hasAdminCredentialsConfigured,
    isValidAdminBasicAuth,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    if (!hasAdminCredentialsConfigured()) {
        return NextResponse.json(
            { error: "Credenciais de admin não configuradas no servidor." },
            { status: 500 }
        );
    }

    let user = "";
    let password = "";

    try {
        const body = await request.json();
        user = typeof body?.user === "string" ? body.user.trim() : "";
        password = typeof body?.password === "string" ? body.password : "";
    } catch {
        return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    if (!user || !password) {
        return NextResponse.json(
            { error: "Usuário e senha são obrigatórios." },
            { status: 400 }
        );
    }

    const basicHeader = `Basic ${btoa(`${user}:${password}`)}`;
    if (!isValidAdminBasicAuth(basicHeader)) {
        return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const token = await createAdminSessionToken(user);
    if (!token) {
        return NextResponse.json(
            { error: "Não foi possível iniciar sessão de admin." },
            { status: 500 }
        );
    }

    const secure = process.env.NODE_ENV === "production";
    const response = NextResponse.json({ success: true });

    response.cookies.set({
        name: getAdminSessionCookieName(),
        value: token,
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: getAdminSessionMaxAgeSeconds(),
    });

    return response;
}
