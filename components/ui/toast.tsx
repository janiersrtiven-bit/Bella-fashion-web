"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

type ToastData = {
    message: string;
    type: ToastType;
    id: number;
};

type ToastViewProps = {
    toast: ToastData | null;
    onClose: () => void;
};

export function useToast(timeoutMs = 3000) {
    const [toast, setToast] = useState<ToastData | null>(null);

    function showToast(message: string, type: ToastType = "info") {
        setToast({ message, type, id: Date.now() });
    }

    function clearToast() {
        setToast(null);
    }

    useEffect(() => {
        if (!toast) return;

        const timeout = setTimeout(() => {
            setToast(null);
        }, timeoutMs);

        return () => clearTimeout(timeout);
    }, [toast, timeoutMs]);

    return { toast, showToast, clearToast };
}

export function ToastView({ toast, onClose }: ToastViewProps) {
    if (!toast) return null;

    const toneClass =
        toast.type === "success"
            ? "border-green-200 bg-green-50 text-green-900"
            : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-blue-200 bg-blue-50 text-blue-900";

    const title =
        toast.type === "success"
            ? "Sucesso"
            : toast.type === "error"
                ? "Atencao"
                : "Informacao";

    const accentClass =
        toast.type === "success"
            ? "bg-green-600"
            : toast.type === "error"
                ? "bg-red-600"
                : "bg-blue-600";

    return (
        <div className="fixed right-4 top-4 z-[60] w-full max-w-sm px-2 sm:right-6 sm:top-6 sm:px-0">
            <div
                className={`overflow-hidden rounded-2xl border shadow-xl ring-1 ring-black/5 ${toneClass}`}
                role="status"
                aria-live="polite"
            >
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className={`mt-1 block h-2.5 w-2.5 shrink-0 rounded-full ${accentClass}`} />
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-80">{title}</p>
                            <p className="mt-1 text-sm leading-5">{toast.message}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-2 py-1 text-xs font-semibold opacity-70 transition hover:bg-black/5 hover:opacity-100"
                        aria-label="Fechar notificacao"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
