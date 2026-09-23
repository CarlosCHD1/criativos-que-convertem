// Meta Conversions API (CAPI) Serverless Endpoint para Vercel
// Suporte completo a Deduplicação (event_id), Advanced Matching (SHA-256) e Test Event Code

const crypto = require('crypto');

/**
 * Normaliza e aplica SHA-256 conforme a especificação da Meta
 */
function hashData(value) {
  if (!value) return undefined;
  const str = String(value).trim().toLowerCase();
  if (/^[a-f0-9]{64}$/i.test(str)) {
    return str; // Já é um hash SHA-256 válido
  }
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Normaliza número de telefone (remove caracteres e garante DDI 55 caso aplicável)
 */
function normalizePhone(phone) {
  if (!phone) return undefined;
  let clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean; // DDI Brasil padrão
  }
  return hashData(clean);
}

module.exports = async function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const pixelId = process.env.META_PIXEL_ID || req.body?.pixel_id;
    const capiToken = process.env.META_CAPI_TOKEN;
    const testCode = process.env.META_TEST_EVENT_CODE || req.body?.test_event_code;

    if (!pixelId) {
      return res.status(400).json({ error: 'META_PIXEL_ID não configurado.' });
    }

    if (!capiToken) {
      // Se ainda não tiver token CAPI cadastrado na Vercel, apenas acusa aviso para não quebrar o frontend
      return res.status(200).json({ 
        warning: 'META_CAPI_TOKEN não configurado no servidor. Configure nas variáveis de ambiente da Vercel para ativar o envio Server-Side.',
        status: 'pending_configuration'
      });
    }

    const {
      event_name,
      event_id,
      event_time = Math.floor(Date.now() / 1000),
      event_source_url,
      user_data = {},
      custom_data = {}
    } = req.body || {};

    if (!event_name) {
      return res.status(400).json({ error: 'event_name é obrigatório.' });
    }

    // Extrai IP real e User-Agent do visitante a partir das requisições Vercel
    const clientIp = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.socket.remoteAddress;

    const clientUserAgent = req.headers['user-agent'] || user_data.client_user_agent;

    // Constrói objeto de Advanced Matching para alta correspondência (Match Quality)
    const formattedUserData = {
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent
    };

    if (user_data.em) formattedUserData.em = [hashData(user_data.em)];
    if (user_data.email) formattedUserData.em = [hashData(user_data.email)];
    
    if (user_data.ph) formattedUserData.ph = [normalizePhone(user_data.ph)];
    if (user_data.phone) formattedUserData.ph = [normalizePhone(user_data.phone)];

    if (user_data.fn || user_data.first_name) {
      formattedUserData.fn = [hashData(user_data.fn || user_data.first_name)];
    }
    if (user_data.ln || user_data.last_name) {
      formattedUserData.ln = [hashData(user_data.ln || user_data.last_name)];
    }

    if (user_data.fbp) formattedUserData.fbp = user_data.fbp;
    if (user_data.fbc) formattedUserData.fbc = user_data.fbc;

    // Monta o payload conforme a documentação oficial da Meta Graph API v20.0
    const metaPayload = {
      data: [
        {
          event_name,
          event_time,
          event_id,
          event_source_url: event_source_url || req.headers.referer,
          action_source: 'website',
          user_data: formattedUserData,
          custom_data
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

    if (!metaResponse.ok) {
      console.error('Meta CAPI Error:', metaResult);
      return res.status(metaResponse.status).json({
        success: false,
        error: metaResult.error || 'Erro ao enviar para a Meta Graph API'
      });
    }

    return res.status(200).json({
      success: true,
      events_received: metaResult.events_received,
      fbtrace_id: metaResult.fbtrace_id
    });

  } catch (error) {
    console.error('CAPI Serverless Error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor CAPI' });
  }
};
