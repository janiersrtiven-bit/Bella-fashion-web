import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdminRequestAuthenticated, isValidAdminBasicAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function unauthorizedResponse() {
    return new NextResponse("Authentication required", {
        status: 401,
        headers: {
            "WWW-Authenticate": 'Basic realm="Bella Fashion Admin"',
        },
    });
}

function getFileExtension(file: File) {
    const fileName = file.name || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    if (ALLOWED_EXTENSIONS.has(extension)) {
        return extension;
    }

    if (file.type === "image/png") return "png";
    if (file.type === "image/webp") return "webp";
    return "jpg";
}

export async function POST(request: Request) {
    const authHeader = request.headers.get("authorization");
    const isBasicAuthenticated = isValidAdminBasicAuth(authHeader);
    const isSessionAuthenticated = await isAdminRequestAuthenticated({
        headers: request.headers,
    });

    if (!isBasicAuthenticated && !isSessionAuthenticated) {
        return unauthorizedResponse();
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
            { error: "BLOB_READ_WRITE_TOKEN não configurado." },
            { status: 500 }
        );
    }

    let formData: FormData;

    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
        return NextResponse.json(
            { error: "Arquivo não enviado. Use o campo 'file'." },
            { status: 400 }
        );
    }

    if (file.size <= 0) {
        return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json(
            { error: "Imagem muito grande. Máximo permitido: 5MB." },
            { status: 400 }
        );
    }

    const extension = getFileExtension(file);
    const typeIsAllowed = ALLOWED_IMAGE_TYPES.has(file.type);
    const extensionIsAllowed = ALLOWED_EXTENSIONS.has(extension);

    if (!typeIsAllowed || !extensionIsAllowed) {
        return NextResponse.json(
            { error: "Formato inválido. Permitidos: jpg, jpeg, png, webp." },
            { status: 400 }
        );
    }

    const pathname = `uploads/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    try {
        const blob = await put(pathname, file, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false,
        });

        return NextResponse.json({
            url: blob.url,
            pathname: blob.pathname,
            contentType: blob.contentType,
        });
    } catch {
        return NextResponse.json(
            { error: "Não foi possível enviar a imagem para o storage." },
            { status: 500 }
        );
    }
}
