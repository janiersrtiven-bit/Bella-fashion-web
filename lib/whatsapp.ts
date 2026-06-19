export function buildWhatsAppLink(whatsapp: string, message: string) {
    const phone = whatsapp.replace(/\D/g, "");
    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
}
