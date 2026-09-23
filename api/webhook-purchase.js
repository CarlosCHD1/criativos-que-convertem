// Webhook Serverless para Plataformas de Pagamento (Kiwify, Hotmart, Eduzz, Braip, Cakto, etc.)
// Converte eventos de compra aprovada em disparos oficiais de 'Purchase' via Meta Conversions API (CAPI)

const crypto = require('crypto');

function hashData(value) {
  if (!value) return undefined;
  const str = String(value).trim().toLowerCase();
  if (/^[a-f0-9]{64}$/i.test(str)) return str;
  return crypto.createHash('sha256').update(str).digest('hex');
}

function normalizePhone(phone) {
  if (!phone) return undefined;
  let clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  return hashData(clean);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const pixelId = process.env.META_PIXEL_ID;
    const capiToken = process.env.META_CAPI_TOKEN;
    const testCode = process.env.META_TEST_EVENT_CODE;

    if (!pixelId || !capiToken) {
      console.warn('Webhook Purchase recebido, mas META_PIXEL_ID ou META_CAPI_TOKEN não estão configurados.');
      return res.status(200).json({ status: 'ignored_missing_credentials' });
    }

    const payload = req.body || {};

    // 1. Identificar status da compra aprovada em diferentes plataformas
    // Kiwify: order_status === 'paid'
    // Hotmart: event === 'PURCHASE_APPROVED'
    // Eduzz: trans_status === 3 (Paga)
    // Braip: type === 'TRANSACTION_STATUS_CHANGED' && status === 'approved'
    const status = (
      payload.order_status ||
      payload.status ||
      payload.event ||
      payload.trans_status ||
      ''
    ).toString().toLowerCase();

    const isPaid = (
      status === 'paid' ||
      status === 'approved' ||
      status === 'purchase_approved' ||
      status === 'completed' ||
      status === '3' ||
      payload.order_status === 'paid'
    );

    if (!isPaid) {
      return res.status(200).json({ status: 'ignored_not_paid', current_status: status });
    }

    // 2. Extrair dados do cliente comprador
    const customer = payload.Customer || payload.customer || payload.buyer || payload.data?.buyer || {};
    const email = customer.email || payload.email || payload.buyer_email;
    const phone = customer.mobile || customer.phone || payload.phone || payload.cellphone;
    const fullName = customer.full_name || customer.name || payload.name || payload.buyer_name || '';
    
    let firstName = '';
    let lastName = '';
    if (fullName) {
      const parts = fullName.trim().split(' ');
      firstName = parts[0];
      if (parts.length > 1) lastName = parts.slice(1).join(' ');
    }

    // 3. Extrair valor e transação
    // Kiwify / Hotmart / Eduzz
    let rawValue = payload.order_amount || payload.amount || payload.price || payload.data?.purchase?.price?.value || 297;
    // Se for em centavos (ex: 29700)
    if (rawValue > 1000 && !String(rawValue).includes('.')) {
      rawValue = rawValue / 100;
    }
    const orderValue = parseFloat(rawValue) || 297.00;
    const currency = (payload.currency || 'BRL').toUpperCase();
    const orderId = payload.order_id || payload.transaction_id || payload.id || `ord_${Date.now()}`;

    // 4. Parâmetros de atribuição se passados pela plataforma
    const utmTracking = payload.tracking || payload.tracking_parameters || {};
    const fbp = utmTracking.fbp || payload.fbp;
    const fbc = utmTracking.fbc || payload.fbc;

    // 5. Montar payload do Meta Purchase
    const formattedUserData = {
      em: [hashData(email)],
      ph: [normalizePhone(phone)]
    };

    if (firstName) formattedUserData.fn = [hashData(firstName)];
    if (lastName) formattedUserData.ln = [hashData(lastName)];
    if (fbp) formattedUserData.fbp = fbp;
    if (fbc) formattedUserData.fbc = fbc;

    const metaPayload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: `purchase_${orderId}`,
          action_source: 'website',
          user_data: formattedUserData,
          custom_data: {
            currency: currency,
            value: orderValue,
            content_type: 'product',
            content_name: 'Curso MIRA — Criativos que Convertem',
            content_ids: ['curso_mira_cqc'],
            num_items: 1,
            order_id: String(orderId)
          }
        }
      ]
    };

    if (testCode) {
      metaPayload.test_event_code = testCode;
    }

    const metaGraphUrl = `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${capiToken}`;

    const metaResponse = await fetch(metaGraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayload)
    });

    const metaResult = await metaResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Purchase event sent to Meta CAPI',
      order_id: orderId,
      meta_response: metaResult
    });

  } catch (error) {
    console.error('Webhook Purchase Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
