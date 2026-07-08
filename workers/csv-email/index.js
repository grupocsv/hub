/**
 * csv-email - Endpoint de E-mail + Submissions
 * Hub CSV Backend | Cloudflare Worker
 *
 * Endpoints:
 *   POST /           - Enviar e-mail (requer token)
 *   POST /submit     - Enviar e-mail + salvar submission no D1 (requer token)
 *   GET  /view/:hash - Recuperar dados de uma submission (público)
 *   GET  /submissions?token=... - Listar submissions (requer token admin)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

const ALLOWED_FROM_DOMAINS = ['mail.grupocsv.com'];
const MAX_RECIPIENTS = 10;
const MAX_ATTACHMENT_SIZE_MB = 10;
const ADMIN_PORTALS = ['icds', 'axiacare', 'thera', 'tea-110', 'tea-094', 'tea-236'];
const NOTIFICATION_EMAILS = ['guilherme@grupocsv.com'];

async function verifyToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const row = await env.DB.prepare(
      'SELECT tenant_id, user_email, expires_at FROM auth_sessions WHERE token = ? AND is_active = 1'
    ).bind(token).first();
    if (!row) return null;
    if (new Date(row.expires_at) < new Date()) return null;
    return { valid: true, portal: row.tenant_id, email: row.user_email };
  } catch (e) {
    return null;
  }
}

async function ensureSubmissionsTable(env) {
  // Verificar se a tabela tem o schema correto
  try {
    await env.DB.prepare('SELECT unit_code FROM tea_submissions LIMIT 1').run();
  } catch (e) {
    // Tabela não existe ou schema errado — recriar
    await env.DB.prepare('DROP TABLE IF EXISTS tea_submissions').run();
    await env.DB.prepare(`
      CREATE TABLE tea_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT UNIQUE NOT NULL,
        unit_code TEXT NOT NULL,
        unit_name TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        progress_pct INTEGER DEFAULT 0,
        form_data TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        submitted_by TEXT DEFAULT ''
      )
    `).run();
  }
}

function generateHash() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let hash = '';
  for (let i = 0; i < 12; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

async function getNextVersion(env, unitCode) {
  const row = await env.DB.prepare(
    'SELECT MAX(version) as max_v FROM tea_submissions WHERE unit_code = ?'
  ).bind(unitCode).first();
  return (row && row.max_v) ? row.max_v + 1 : 1;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // GET /view/:hash - público, sem token
    if (request.method === 'GET' && path.startsWith('/view/')) {
      const hash = path.split('/view/')[1];
      if (!hash) return jsonResponse(400, { error: 'Hash não informado.' });
      try {
        const row = await env.DB.prepare(
          'SELECT unit_code, unit_name, version, progress_pct, form_data, submitted_at FROM tea_submissions WHERE hash = ?'
        ).bind(hash).first();
        if (!row) return jsonResponse(404, { error: 'Formulário não encontrado.' });
        return jsonResponse(200, {
          unit_code: row.unit_code,
          unit_name: row.unit_name,
          version: row.version,
          progress_pct: row.progress_pct,
          form_data: JSON.parse(row.form_data),
          submitted_at: row.submitted_at
        });
      } catch (e) {
        return jsonResponse(500, { error: 'Erro ao buscar formulário.', message: e.message });
      }
    }

    // GET /submissions - requer token admin
    if (request.method === 'GET' && path === '/submissions') {
      const session = await verifyToken(request, env);
      if (!session || !ADMIN_PORTALS.includes(session.portal)) {
        return jsonResponse(401, { error: 'Acesso restrito.' });
      }
      try {
        const rows = await env.DB.prepare(
          'SELECT hash, unit_code, unit_name, version, progress_pct, submitted_at, submitted_by FROM tea_submissions ORDER BY submitted_at DESC LIMIT 100'
        ).all();
        return jsonResponse(200, { submissions: rows.results || [] });
      } catch (e) {
        return jsonResponse(500, { error: 'Erro ao listar submissions.', message: e.message });
      }
    }

    // POST /submit - enviar e-mail + salvar submission
    if (request.method === 'POST' && path === '/submit') {
      const session = await verifyToken(request, env);
      if (!session) {
        return jsonResponse(401, { error: 'Token de autenticação ausente ou inválido.' });
      }

      const RESEND_API_KEY = env.RESEND_API_KEY;
      if (!RESEND_API_KEY) {
        return jsonResponse(500, { error: 'Configuração de e-mail ausente.' });
      }

      try {
        const body = await request.json();

        // Validar campos obrigatórios do submit
        if (!body.unit_code || !body.unit_name) {
          return jsonResponse(400, { error: 'Campos unit_code e unit_name são obrigatórios.' });
        }
        if (!body.form_data) {
          return jsonResponse(400, { error: 'Campo form_data é obrigatório.' });
        }

        // Salvar no D1
        const hash = generateHash();
        const version = await getNextVersion(env, body.unit_code);
        const progressPct = body.progress_pct || 0;
        const now = new Date().toISOString();

        await env.DB.prepare(
          'INSERT INTO tea_submissions (hash, unit_code, unit_name, version, progress_pct, form_data, submitted_at, submitted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(hash, body.unit_code, body.unit_name, version, progressPct, JSON.stringify(body.form_data), now, session.email).run();

        // Enviar e-mail principal (se dados de e-mail fornecidos)
        let emailResult = null;
        if (body.email_payload) {
          const ep = body.email_payload;
          if (!ep.to || !ep.subject || (!ep.html && !ep.text)) {
            return jsonResponse(400, { error: 'email_payload incompleto (to, subject, html/text).' });
          }
          emailResult = await sendEmail(env, RESEND_API_KEY, ep);
        }

        // C7: Notificação interna
        const viewUrl = `https://hub.grupocsv.com/p/tea-dataset/?view=${hash}`;
        const notifHtml = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#1B3A5C;margin-bottom:16px">Data Set TEA — Novo Envio</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:40%">Unidade</td><td style="padding:8px;border-bottom:1px solid #eee">${body.unit_name}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Código</td><td style="padding:8px;border-bottom:1px solid #eee">${body.unit_code}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Versão</td><td style="padding:8px;border-bottom:1px solid #eee">v${version}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Progresso</td><td style="padding:8px;border-bottom:1px solid #eee">${progressPct}%</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Data</td><td style="padding:8px;border-bottom:1px solid #eee">${new Date(now).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Enviado por</td><td style="padding:8px;border-bottom:1px solid #eee">${session.email}</td></tr>
            </table>
            <a href="${viewUrl}" style="display:inline-block;padding:12px 24px;background:#1B3A5C;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Visualizar formulário</a>
            <p style="color:#888;font-size:12px;margin-top:20px">Notificação automática do Data Set TEA — Hub CSV</p>
          </div>
        `;

        // Notificação não-bloqueante: se falhar, não trava o submit
        try {
          await sendEmail(env, RESEND_API_KEY, {
            to: NOTIFICATION_EMAILS,
            subject: `[TEA] ${body.unit_name} \u2014 v${version} (${progressPct}%)`,
            html: notifHtml,
            from_name: 'Data Set TEA',
            from_email: 'hub@mail.grupocsv.com'
          });
        } catch (notifErr) {
          // Log silencioso, não bloqueia o submit
          console.error('Falha na notificação:', notifErr.message);
        }

        return jsonResponse(200, {
          success: true,
          hash,
          version,
          view_url: viewUrl,
          email: emailResult
        });

      } catch (err) {
        return jsonResponse(500, { error: 'Erro interno.', message: err.message });
      }
    }

    // POST / - enviar e-mail simples (legado)
    if (request.method === 'POST' && (path === '/' || path === '')) {
      const session = await verifyToken(request, env);
      if (!session) {
        return jsonResponse(401, { error: 'Token de autenticação ausente ou inválido.' });
      }

      const RESEND_API_KEY = env.RESEND_API_KEY;
      if (!RESEND_API_KEY) {
        return jsonResponse(500, { error: 'Configuração de e-mail ausente.' });
      }

      try {
        const body = await request.json();
        if (!body.to) return jsonResponse(400, { error: 'Campo "to" é obrigatório.' });
        if (!body.subject) return jsonResponse(400, { error: 'Campo "subject" é obrigatório.' });
        if (!body.html && !body.text) return jsonResponse(400, { error: 'É necessário informar "html" ou "text".' });

        const result = await sendEmail(env, RESEND_API_KEY, body);
        return jsonResponse(result.ok ? 200 : 502, result);
      } catch (err) {
        return jsonResponse(500, { error: 'Erro interno.', message: err.message });
      }
    }

    return jsonResponse(404, { error: 'Rota não encontrada.' });
  }
};

async function sendEmail(env, apiKey, body) {
  const to = Array.isArray(body.to) ? body.to : [body.to];
  const cc = body.cc ? (Array.isArray(body.cc) ? body.cc : [body.cc]) : undefined;
  const bcc = body.bcc ? (Array.isArray(body.bcc) ? body.bcc : [body.bcc]) : undefined;

  const totalRecipients = to.length + (cc ? cc.length : 0) + (bcc ? bcc.length : 0);
  if (totalRecipients > MAX_RECIPIENTS) {
    return { ok: false, error: `Limite de ${MAX_RECIPIENTS} destinatários excedido.` };
  }

  const allEmails = [...to, ...(cc || []), ...(bcc || [])];
  for (const email of allEmails) {
    if (!isValidEmail(email)) return { ok: false, error: `E-mail inválido: ${email}` };
  }

  const fromName = body.from_name || 'Hub CSV';
  const fromEmail = body.from_email || 'hub@mail.grupocsv.com';
  const fromDomain = fromEmail.split('@')[1];
  if (!ALLOWED_FROM_DOMAINS.includes(fromDomain)) {
    return { ok: false, error: `Domínio "${fromDomain}" não autorizado.` };
  }

  if (body.attachments && Array.isArray(body.attachments)) {
    for (const att of body.attachments) {
      if (!att.filename) return { ok: false, error: 'Cada anexo precisa de "filename".' };
      if (!att.content) return { ok: false, error: `Anexo "${att.filename}" sem "content".` };
      const approxBytes = (att.content.length * 3) / 4;
      if (approxBytes > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
        return { ok: false, error: `Anexo "${att.filename}" excede ${MAX_ATTACHMENT_SIZE_MB}MB.` };
      }
    }
  }

  const resendPayload = {
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: body.subject
  };

  if (body.html) resendPayload.html = body.html;
  if (body.text) resendPayload.text = body.text;
  if (body.reply_to) resendPayload.reply_to = body.reply_to;
  if (cc) resendPayload.cc = cc;
  if (bcc) resendPayload.bcc = bcc;
  if (body.tags) resendPayload.tags = body.tags;
  if (body.attachments && body.attachments.length > 0) {
    resendPayload.attachments = body.attachments.map(att => ({
      filename: att.filename,
      content: att.content,
      ...(att.content_type ? { content_type: att.content_type } : {})
    }));
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resendPayload)
  });

  const resendData = await resendResponse.json();

  if (!resendResponse.ok) {
    return { ok: false, error: 'Falha no envio.', details: resendData };
  }

  return {
    ok: true,
    success: true,
    message: `E-mail enviado para ${to.length} destinatário(s).`,
    id: resendData.id,
    to,
    subject: body.subject
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}
