export type ShippingProvider = "manual" | "correios" | "melhor_envio";

const CORREIOS_TRACKING_URL = "https://rastreamento.correios.com.br/app/index.php";

export function normalizeTrackingCode(code?: string | null) {
  return code?.trim().replace(/\s+/g, "") || "";
}

export function getTrackingUrl(
  code?: string | null,
  provider: ShippingProvider = "manual"
) {
  const trackingCode = normalizeTrackingCode(code);
  if (!trackingCode) return null;

  if (provider === "manual" || provider === "correios") {
    return `${CORREIOS_TRACKING_URL}?objeto=${encodeURIComponent(trackingCode)}`;
  }

  return null;
}

export function getConfiguredShippingProvider(): ShippingProvider {
  const provider =
    typeof process !== "undefined"
      ? process.env.SHIPPING_PROVIDER?.trim().toLowerCase()
      : undefined;

  if (provider === "correios" || provider === "melhor_envio") {
    return provider;
  }

  return "manual";
}

export function shippingProviderNeedsCredentials(provider: ShippingProvider) {
  return provider === "correios" || provider === "melhor_envio";
}
