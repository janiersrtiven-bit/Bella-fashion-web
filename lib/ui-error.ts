export function toUserFacingError(rawError: unknown, fallbackMessage: string) {
    const raw = typeof rawError === "string" ? rawError : "";
    const normalized = raw.toLowerCase();

    if (!normalized) {
        return fallbackMessage;
    }

    if (
        normalized.includes("database_url") ||
        normalized.includes("fonte de dados 'db'") ||
        normalized.includes("postgresql://") ||
        normalized.includes("postgres://")
    ) {
        return "Nao foi possivel concluir a operacao agora. A configuracao do banco no servidor precisa ser revisada.";
    }

    if (normalized.includes("blob_read_write_token")) {
        return "Upload indisponivel no momento. Verifique a configuracao do storage e tente novamente.";
    }

    if (normalized.includes("payload json invalido") || normalized.includes("unexpected")) {
        return "Dados invalidos enviados. Atualize a pagina e tente novamente.";
    }

    if (normalized.includes("nao foi possivel conectar") || normalized.includes("failed to fetch")) {
        return "Sem conexao com o servidor. Tente novamente em alguns instantes.";
    }

    return fallbackMessage;
}