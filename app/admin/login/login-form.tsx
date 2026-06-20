"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
    nextPath: string;
};

export default function LoginForm({ nextPath }: LoginFormProps) {
    const router = useRouter();

    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!user || !password) {
            setError("Preencha usuário e senha.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user, password }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data?.error || "Não foi possível fazer login.");
                return;
            }

            router.replace(nextPath);
            router.refresh();
        } catch {
            setError("Não foi possível conectar ao servidor.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
                <span className="mb-2 block text-sm font-semibold text-purple-900">Usuário</span>
                <input
                    type="text"
                    value={user}
                    onChange={(event) => setUser(event.target.value)}
                    className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                    autoComplete="username"
                />
            </label>

            <label className="block">
                <span className="mb-2 block text-sm font-semibold text-purple-900">Senha</span>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-purple-100 px-4 py-3 outline-none transition focus:border-purple-700"
                    autoComplete="current-password"
                />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-purple-800 px-5 py-3 font-semibold text-white transition hover:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
        </form>
    );
}
