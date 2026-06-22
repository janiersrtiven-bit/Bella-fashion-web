const ADMIN_SESSION_COOKIE = "bella_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

type RequestLike = {
    headers: {
        get(name: string): string | null;
    };
};

function decodeBase64(value: string) {
    if (typeof atob === "function") {
        return atob(value);
    }

    return Buffer.from(value, "base64").toString("utf-8");
}

function encodeBase64(value: string) {
    if (typeof btoa === "function") {
        return btoa(value);
    }

    return Buffer.from(value, "utf-8").toString("base64");
}

function toBase64Url(value: string) {
    return encodeBase64(value)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
    const base64 = value
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(value.length / 4) * 4, "=");

    return decodeBase64(base64);
}

function getCookieValue(cookieHeader: string | null, key: string) {
    if (!cookieHeader) {
        return null;
    }

    const pairs = cookieHeader.split(";");

    for (const pair of pairs) {
        const [rawKey, ...rest] = pair.trim().split("=");
        if (rawKey === key) {
            return rest.join("=");
        }
    }

    return null;
}

function getAdminSecret() {
    return process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
}

function getAdminCredentials() {
    const user = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASSWORD;

    if (!user || !password) {
        return null;
    }

    return { user, password };
}

async function getSigningKey() {
    const secret = getAdminSecret();
    if (!secret) {
        return null;
    }

    return crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

async function signPayload(payload: string) {
    const key = await getSigningKey();
    if (!key) return null;

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(payload)
    );

    const bytes = Array.from(new Uint8Array(signature));
    const binary = String.fromCharCode(...bytes);

    return toBase64Url(binary);
}

async function verifyPayloadSignature(payload: string, signature: string) {
    const key = await getSigningKey();
    if (!key) return false;

    try {
        const binary = fromBase64Url(signature);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        return crypto.subtle.verify(
            "HMAC",
            key,
            bytes,
            new TextEncoder().encode(payload)
        );
    } catch {
        return false;
    }
}

function decodeBasicCredentials(authHeader: string | null) {
    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return null;
    }

    try {
        const base64Credentials = authHeader.split(" ")[1] ?? "";
        const decoded = decodeBase64(base64Credentials);
        const separatorIndex = decoded.indexOf(":");

        if (separatorIndex < 0) {
            return null;
        }

        return {
            user: decoded.slice(0, separatorIndex),
            password: decoded.slice(separatorIndex + 1),
        };
    } catch {
        return null;
    }
}

export function getAdminSessionCookieName() {
    return ADMIN_SESSION_COOKIE;
}

export function getAdminSessionMaxAgeSeconds() {
    return ADMIN_SESSION_TTL_SECONDS;
}

export async function createAdminSessionToken(user: string) {
    const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
    const payload = `${user}.${exp}`;
    const signature = await signPayload(payload);

    if (!signature) {
        return null;
    }

    return `${toBase64Url(payload)}.${signature}`;
}

export async function isValidAdminSessionToken(token: string | null) {
    const credentials = getAdminCredentials();
    if (!credentials || !token) {
        return false;
    }

    const [encodedPayload, providedSignature] = token.split(".");
    if (!encodedPayload || !providedSignature) {
        return false;
    }

    try {
        const payload = fromBase64Url(encodedPayload);
        const [user, expRaw] = payload.split(".");
        const exp = Number(expRaw);

        if (!user || !Number.isFinite(exp)) {
            return false;
        }

        if (Date.now() >= exp * 1000) {
            return false;
        }

        if (user !== credentials.user) {
            return false;
        }

        return verifyPayloadSignature(payload, providedSignature);
    } catch {
        return false;
    }
}

export function isValidAdminBasicAuth(authHeader: string | null) {
    const credentials = getAdminCredentials();
    if (!credentials) {
        return false;
    }

    const parsed = decodeBasicCredentials(authHeader);
    if (!parsed) {
        return false;
    }

    return parsed.user === credentials.user && parsed.password === credentials.password;
}

export async function isAdminRequestAuthenticated(request: RequestLike) {
    const authHeader = request.headers.get("authorization");
    if (isValidAdminBasicAuth(authHeader)) {
        return true;
    }

    const cookieHeader = request.headers.get("cookie");
    const sessionToken = getCookieValue(cookieHeader, ADMIN_SESSION_COOKIE);

    return isValidAdminSessionToken(sessionToken);
}

export function hasAdminCredentialsConfigured() {
    return Boolean(getAdminCredentials());
}
