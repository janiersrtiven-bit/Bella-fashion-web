import LoginForm from "./login-form";

type LoginPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveNextPath(value: string | string[] | undefined) {
    const nextPath = Array.isArray(value) ? value[0] : value;
    if (
        !nextPath ||
        !nextPath.startsWith("/") ||
        nextPath.startsWith("//") ||
        nextPath.includes("\\")
    ) {
        return "/admin";
    }

    return nextPath;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
    const params = (await searchParams) || {};
    const nextPath = resolveNextPath(params.next);

    return (
        <main className="flex min-h-screen items-center justify-center bg-purple-50 p-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-500">
                    Painel Administrativo
                </p>
                <h1 className="mt-2 text-3xl font-bold text-purple-950">Entrar no Admin</h1>
                <p className="mt-3 text-sm text-gray-600">
                    Acesse com suas credenciais de administrador para gerenciar produtos e pedidos.
                </p>

                <LoginForm nextPath={nextPath} />
            </div>
        </main>
    );
}
