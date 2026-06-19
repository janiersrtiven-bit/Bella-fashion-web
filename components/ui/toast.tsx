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
            ? "border-green-200 bg-green-50 text-green-800"
            : toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800";

    return (
        <div className="fixed right-6 top-6 z-[60] w-full max-w-sm">
            <div className={`rounded-2xl border px-4 py-3 shadow-lg ${toneClass}`}>
                <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{toast.message}</p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs font-bold opacity-70 transition hover:opacity-100"
                        aria-label="Fechar notificação"
                    >
                        X
                    </button>
                </div>
            </div>
        </div>
    );
}
