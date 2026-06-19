# Bella Fashion Web

Loja Next.js com checkout, pedidos automáticos em banco (Prisma), Stripe e notificações automáticas.

## Estado atual (pronto para vender)

- Pedidos automáticos: ativo.
- Atualização de estoque automática: ativa.
- Checkout Stripe com sessão de pagamento: ativo.
- Confirmação automática de pagamento via webhook Stripe: ativa.
- Notificação automática por e-mail (SMTP): ativa quando variáveis SMTP estão preenchidas.
- Notificação automática por WhatsApp Cloud API: ativa quando token e phone number ID estão preenchidos.
- Painel administrativo protegido por autenticação básica: ativo quando ADMIN_USER e ADMIN_PASSWORD estão preenchidos.

## Executar localmente

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Configuração de produção (3 pontos, um por um)

### 1) Gmail automático (pedido criado e pagamento confirmado)

Preencha no `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="janierstivenrodrigueslondono@gmail.com"
SMTP_PASS="SUA_APP_PASSWORD_GMAIL"
COMPANY_EMAIL="janierstivenrodrigueslondono@gmail.com"
```

Observação:
- Para Gmail, use App Password (não a senha normal).

### 2) Stripe com confirmação automática de pagamento

Preencha no `.env`:

```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

No painel Stripe:
- Endpoint webhook: `https://seu-dominio.com/api/stripe/webhook`
- Evento obrigatório: `checkout.session.completed`

Resultado:
- Quando o cliente paga, o pedido é atualizado automaticamente para:
	- `statusPagamento = Pago`
	- `statusPedido = Pagamento confirmado`

### 3) WhatsApp automático (empresa Bella Fashion)

Preencha no `.env`:

```env
COMPANY_WHATSAPP="11940625832"
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_CLOUD_TOKEN="..."
```

Resultado:
- Mensagem automática para o WhatsApp da empresa quando pedido é criado.
- Mensagem automática para o WhatsApp da empresa quando pagamento é confirmado.

### 4) Segurança do painel admin

Preencha no `.env`:

```env
ADMIN_USER="seu_usuario_forte"
ADMIN_PASSWORD="sua_senha_forte"
```

Resultado:
- Rotas `/admin/*` exigem login.
- Alterações em produtos e pedidos (PUT/DELETE) exigem login.

### 5) Compliance mínimo para venda

- Política de Privacidade publicada em `/politica-privacidade`.
- Termos de Uso publicados em `/termos`.
- Links disponíveis no rodapé do site.

## Observação de segurança

Nenhum sistema é 100% inviolável, mas este projeto já está com hardening base de produção:
- Headers de segurança HTTP (CSP, HSTS, X-Frame-Options, etc.).
- Webhook Stripe com validação de assinatura.
- Validação de payload com Zod nos endpoints críticos.
- Controle de acesso ao painel administrativo.

## Variáveis de ambiente completas

Use `.env.example` como base.

## Verificação final antes de publicar

```bash
npm run build
```

Se o build passar, a aplicação está pronta para deploy.
