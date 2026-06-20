"use client";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
]);

export function isInvalidImageValue(value: string | null | undefined) {
    const normalized = value?.trim().toLowerCase();
    return Boolean(normalized && (normalized.startsWith("blob:") || normalized.startsWith("data:")));
}

export async function uploadImageToServer(file: File) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        throw new Error("Formato inválido. Use JPG, JPEG, PNG ou WEBP.");
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        throw new Error("Imagem muito grande. Máximo permitido: 5MB.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Não foi possível enviar a imagem.");
    }

    return data.url as string;
}
