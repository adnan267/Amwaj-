import nodemailer from 'nodemailer';

let transport = null;
if (process.env.SMTP_HOST) {
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Email the team about a new enquiry. Silently skipped when SMTP is not configured. */
export async function notifyEnquiry(e) {
  if (!transport || !process.env.NOTIFY_EMAIL) return;
  const rows = [
    ['Name', e.name], ['Phone', e.phone], ['Email', e.email], ['Interested in', e.interest], ['Location', e.location], ['Message', e.message],
  ].filter(([, v]) => v);
  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.NOTIFY_EMAIL,
      replyTo: e.email || undefined,
      subject: `New enquiry: ${e.name}${e.interest ? ` (${e.interest})` : ''}`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
      html: `<table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`,
    });
  } catch (err) {
    console.error('Enquiry email failed:', err.message);
  }
}
