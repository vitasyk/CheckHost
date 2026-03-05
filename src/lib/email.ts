import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@checknode.io';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://checknode.io';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'CheckNode';

// ─── Helper: meta detail blocks ────────────────────────────────────────────────

function metaDetailsHtml(type: string, meta: Record<string, any> = {}): string {
  const rows: string[] = [];

  // SSL details
  if (type === 'ssl') {
    if (meta.ssl_expiry) {
      const expiry = new Date(meta.ssl_expiry).toUTCString();
      const days = meta.ssl_days_left;
      const daysColor = days < 0 ? '#ef4444' : days < 14 ? '#f59e0b' : '#10b981';
      rows.push(detailRow('Expiry Date', `<span style="color:${daysColor}">${expiry}</span>`));
      rows.push(detailRow('Days Left', `<span style="color:${daysColor};font-weight:700">${days} days</span>`));
    }
    if (meta.ssl_issuer) rows.push(detailRow('Issuer', meta.ssl_issuer));
    if (meta.ssl_subject) rows.push(detailRow('Subject', meta.ssl_subject));
  }

  // DNS details
  if (type === 'dns') {
    if (meta.dns_ips?.length) {
      rows.push(detailRow('A Records', meta.dns_ips.join('<br/>')));
    }
    if (meta.dns_mx?.length) {
      rows.push(detailRow('MX Records', meta.dns_mx.join('<br/>')));
    }
  }

  // SMTP / Uptime RTT
  if (meta.last_rtt !== undefined) {
    rows.push(detailRow('Response Time', `${meta.last_rtt}ms`));
  }

  // Error
  if (meta.last_error) {
    rows.push(detailRow('Error', `<span style="color:#f87171">${meta.last_error}</span>`));
  }

  if (!rows.length) return '';

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
      ${rows.join('')}
    </table>`;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="background:#1a1f2e;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.05);width:36%;">
        <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${label}</span>
      </td>
      <td style="background:#1a1f2e;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="color:#e2e8f0;font-size:13px;">${value}</span>
      </td>
    </tr>`;
}

// ─── Base Template ─────────────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${SITE_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="padding:28px 40px;background:linear-gradient(135deg,#6366f1,#4f46e5);">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                📡 ${SITE_NAME}
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Monitoring Alerts</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
                You received this email because you enabled monitoring on 
                <a href="${SITE_URL}" style="color:#6366f1;text-decoration:none;">${SITE_NAME}</a>.<br/>
                To stop receiving alerts, remove this email from your monitor settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Alert Template ────────────────────────────────────────────────────────────

function alertTemplate(domain: string, type: string, meta: Record<string, any>) {
  const typeLabel = type.toUpperCase();
  return baseTemplate(`
    <div style="display:inline-block;background:#ef44441a;border:1px solid #ef4444;border-radius:8px;padding:6px 14px;margin-bottom:24px;">
      <span style="color:#ef4444;font-size:13px;font-weight:700;">🔴 ALERT — Service Issue Detected</span>
    </div>
    <h2 style="margin:0 0 4px;color:#f1f5f9;font-size:20px;font-weight:800;">${domain}</h2>
    <p style="margin:0 0 20px;color:#94a3b8;font-size:14px;">
      Your <strong style="color:#e2e8f0;">${typeLabel}</strong> monitor has detected an issue.
    </p>
    ${metaDetailsHtml(type, meta)}
    <a href="${SITE_URL}/dashboard" 
       style="display:inline-block;margin-top:8px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;">
      View Dashboard →
    </a>
  `);
}

// ─── Recovery Template ─────────────────────────────────────────────────────────

function recoveryTemplate(domain: string, type: string, meta: Record<string, any>) {
  const typeLabel = type.toUpperCase();
  return baseTemplate(`
    <div style="display:inline-block;background:#10b9811a;border:1px solid #10b981;border-radius:8px;padding:6px 14px;margin-bottom:24px;">
      <span style="color:#10b981;font-size:13px;font-weight:700;">✅ RECOVERED — Service Back Online</span>
    </div>
    <h2 style="margin:0 0 4px;color:#f1f5f9;font-size:20px;font-weight:800;">${domain}</h2>
    <p style="margin:0 0 20px;color:#94a3b8;font-size:14px;">
      Great news! Your <strong style="color:#e2e8f0;">${typeLabel}</strong> monitor is back to normal.
    </p>
    ${metaDetailsHtml(type, meta)}
    <a href="${SITE_URL}/dashboard" 
       style="display:inline-block;margin-top:8px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;">
      View Dashboard →
    </a>
  `);
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function sendMonitorAlert(
  to: string,
  domain: string,
  type: string,
  meta: Record<string, any> = {}
) {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `🔴 Alert: ${type.toUpperCase()} issue detected on ${domain}`,
      html: alertTemplate(domain, type, meta),
    });

    if (error) {
      console.error('[Email] Failed to send alert:', error);
      return { success: false, error };
    }

    console.log(`[Email] Alert sent to ${to} for ${domain} (${type})`);
    return { success: true };
  } catch (e: any) {
    console.error('[Email] Exception sending alert:', e);
    return { success: false, error: e.message };
  }
}

export async function sendMonitorRecovery(
  to: string,
  domain: string,
  type: string,
  meta: Record<string, any> = {}
) {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `✅ Recovered: ${type.toUpperCase()} monitor for ${domain} is back online`,
      html: recoveryTemplate(domain, type, meta),
    });

    if (error) {
      console.error('[Email] Failed to send recovery:', error);
      return { success: false, error };
    }

    console.log(`[Email] Recovery sent to ${to} for ${domain} (${type})`);
    return { success: true };
  } catch (e: any) {
    console.error('[Email] Exception sending recovery:', e);
    return { success: false, error: e.message };
  }
}
