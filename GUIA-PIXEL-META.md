# Guia Completo: Meta Pixel + API de Conversões (CAPI) — Curso MIRA

Este guia orienta passo a passo como ativar o **Meta Pixel** e a **API de Conversões no Servidor (CAPI)** na sua Landing Page hospedada na Vercel para alcançar a **máxima pontuação de qualidade de correspondência (Match Quality 8.5 a 10.0)** e alimentar o algoritmo com **compradores reais**.

---

## 1. O que foi implementado no projeto

| Recurso | Tipo | O que faz / Benefício |
|---|---|---|
| **Deduplicação Browser + Server** | CAPI + Pixel | Envia o mesmo `event_id` pelo navegador e pelo servidor. O Meta não duplica dados e recupera 100% das conversões bloqueadas por AdBlock ou iOS 14.5+. |
| **Advanced Matching (SHA-256)** | Dados Avançados | Criptografa email, telefone e nome com SHA-256 no servidor e navegador, aumentando drasticamente o reconhecimento do comprador pelo Meta. |
| **Lead Tracking** | Evento | Disparado ao preencher o formulário no modal de checkout (com Nome, Email e WhatsApp). |
| **Clientes Quentes (Retenção)** | Custom Events | Dispara `ScrollDepth_75`, `ScrollDepth_90` e `TimeOnPage_2Min_HotLead` para identificar usuários com altíssimo interesse e criar Públicos Personalizados (Custom Audiences) para remarketing cirúrgico. |
| **VSL Tracking** | Custom Events | Dispara marcos de consumo da aula/vídeo (`VSL_Watched_50`, `VSL_Pitch_Reached`). |
| **InitiateCheckout** | Evento Padrão | Disparado nos botões de CTA e ao abrir a janela de inscrição. |
| **Purchase Serverless Webhook** | Evento de Ouro | Endpoint `/api/webhook-purchase` pronto para receber notificações de compra paga (Kiwify, Hotmart, Eduzz, Braip) e enviar o valor em R$ diretamente para a Meta. |

---

## 2. Como pegar seu Pixel ID e Token CAPI no Meta

### Passo A: Pegar o ID do Pixel
1. Acesse o [Gerenciador de Eventos da Meta (Events Manager)](https://business.facebook.com/events_manager2).
2. Selecione a sua conta de anúncios e clique no seu **Pixel / Conjunto de Dados**.
3. Copie o **Identificador do Pixel** (um número de 15 a 16 dígitos, ex: `987654321098765`).

### Passo B: Gerar o Token de Acesso da API de Conversões
1. No mesmo Gerenciador de Eventos, clique na aba **"Configurações"**.
2. Role para baixo até a seção **"API de Conversões"**.
3. Na seção "Configurar manualmente", clique no link azul **"Gerar token de acesso"**.
4. Copie o token gerado (uma string longa de letras e números). Guarde-o com segurança.

---

## 3. Onde colocar as credenciais

### No Frontend (`index.html`):
Abra o arquivo [`landing-page/index.html`](file:///c:/Users/CarlosCHD/Documents/Documentos/Projeto%20MIRA%20Search%20%28Pesquisa%29/landing-page/index.html) e substitua `'YOUR_PIXEL_ID'` pelo seu número de Pixel real:

```html
<script>
  window.MIRA_CONFIG = {
    pixelId: 'COLE_SEU_PIXEL_ID_AQUI',
    capiEndpoint: '/api/meta-capi',
    currency: 'BRL',
    productValue: 297.00
  };
</script>
```

### Na Vercel (Painel Web da Vercel):
Para o envio Server-Side (CAPI) funcionar 100%:
1. Acesse seu painel no [Vercel Dashboard](https://vercel.com).
2. Entre no projeto **`criativos-que-convertem`**.
3. Vá em **Settings** > **Environment Variables**.
4. Adicione as variáveis:
   - **`META_PIXEL_ID`**: (Seu ID numérico do Pixel)
   - **`META_CAPI_TOKEN`**: (O token longo gerado na etapa anterior)
   - **`META_TEST_EVENT_CODE`**: *(Opcional, apenas quando estiver testando eventos ao vivo, ex: `TEST12345`)*
5. Clique em **Save** e faça um novo **Redeploy** na Vercel para carregar as novas variáveis.

---

## 4. Como Integrar o Webhook de Vendas (Kiwify / Hotmart / Eduzz)

Quando um aluno compra o curso pela Kiwify, Hotmart ou Eduzz, a plataforma pode avisar seu servidor automaticamente para mandar o evento de `Purchase` para a Meta, mesmo se o aluno fechar a página antes de carregar o obrigado!

1. Na sua plataforma de pagamento (ex: Kiwify ou Hotmart), vá na seção de **Webhooks / Notificações**.
2. Crie uma nova URL de Webhook apontando para:
   ```
   https://SEU-DOMINIO-VERCEL.app/api/webhook-purchase
   ```
3. Selecione o evento: **Compra Aprovada / Pagamento Aprovado**.
4. Pronto! Cada venda confirmada vai disparar um `Purchase` verificado com o valor real e dados do comprador para o Meta CAPI.

---

## 5. Como Testar e Validar

1. **Meta Pixel Helper**: Instale a extensão oficial gratuita do Google Chrome [Meta Pixel Helper](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc). Ao navegar no seu site, você verá o ícone verde indicando `PageView`, `InitiateCheckout`, etc.
2. **Aba Testar Eventos (Events Manager)**:
   - No Gerenciador de Eventos da Meta, abra a aba **Testar Eventos**.
   - Coloque a URL do seu site no campo "Testar eventos do navegador" e clique em "Abrir site".
   - Você verá os eventos de **Navegador** e **Servidor** chegando juntos com a tag **Deduplicado**!
