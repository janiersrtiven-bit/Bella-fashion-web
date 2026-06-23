const fs = require('fs');
const path = require('path');

function parseEnv(filePath) {
    const env = {};
    if (!fs.existsSync(filePath)) return env;

    const content = fs.readFileSync(filePath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex < 0) continue;
        const key = trimmed.slice(0, equalIndex).trim();
        let value = trimmed.slice(equalIndex + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        env[key] = value;
    }
    return env;
}

function isPlaceholder(value) {
    if (!value) return true;
    const normalized = value.trim().toLowerCase();
    return [
        'cole_aqui',
        'your',
        'token',
        'phone_number_id',
        'change_this',
        'example',
        'xxxx',
    ].some((keyword) => normalized.includes(keyword));
}

(async () => {
    const env = { ...parseEnv(path.resolve(__dirname, '../.env')), ...process.env };
    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
    const token = env.WHATSAPP_CLOUD_TOKEN;
    const companyWhatsapp = env.COMPANY_WHATSAPP || env.TEST_WHATSAPP_TO;

    console.log('WHATSAPP_PHONE_NUMBER_ID:', phoneNumberId ? 'present' : 'missing');
    console.log('WHATSAPP_CLOUD_TOKEN:', token ? 'present' : 'missing');
    console.log('PHONE TO:', companyWhatsapp || 'missing');

    if (!phoneNumberId || !token || !companyWhatsapp) {
        console.error('Faltan valores necesarios para probar WhatsApp. Ajusta .env con WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_CLOUD_TOKEN y COMPANY_WHATSAPP (o TEST_WHATSAPP_TO).');
        process.exit(1);
    }

    if (isPlaceholder(phoneNumberId) || isPlaceholder(token)) {
        console.error('Los valores de WhatsApp parecen ser de ejemplo/placeholder. Reemplázalos por credenciales reales antes de probar.');
        process.exit(1);
    }

    const to = companyWhatsapp.replace(/\D/g, '');
    const message = 'Teste de mensagem WhatsApp Bella Fashion. Se receber, o token está válido.';

    try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to.startsWith('55') ? to : `55${to}`,
                type: 'text',
                text: { body: message },
            }),
        });

        const responseText = await response.text();
        console.log('HTTP status:', response.status);
        console.log('Response body:', responseText);
        if (!response.ok) process.exit(1);
    } catch (error) {
        console.error('Error al llamar a la API de WhatsApp:', error);
        process.exit(1);
    }
})();
