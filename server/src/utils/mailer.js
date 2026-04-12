import nodemailer from 'nodemailer';

let transport;

/** Gmail app passwords are shown with spaces; SMTP expects 16 characters with no spaces. */
function gmailCredentials() {
  const user = String(process.env.EMAIL_USER || '').trim();
  const pass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');
  return { user, pass };
}

function getTransport() {
  if (transport) return transport;
  const gmail = gmailCredentials();
  if (gmail.user && gmail.pass) {
    // Explicit Gmail SMTP; use an App Password if 2-Step Verification is on.
    transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: gmail.user,
        pass: gmail.pass
      },
      tls: { rejectUnauthorized: true }
    });
    return transport;
  }
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: String(process.env.SMTP_USER || '').trim(),
        pass: String(process.env.SMTP_PASS || '')
      }
    });
    return transport;
  }
  throw new Error('Email transporter is not configured. Set EMAIL_USER and EMAIL_PASS.');
}

export async function sendEmail(input, subjectArg, htmlArg) {
  const isObject = typeof input === 'object' && input !== null;
  const to = isObject ? input.to : input;
  const subject = isObject ? input.subject : subjectArg;
  const html = isObject ? input.html || input.text || '' : htmlArg;
  if (!to) return;
  const transporter = getTransport();
  const from =
    (process.env.MAIL_FROM || '').trim() || gmailCredentials().user || process.env.SMTP_USER || '';
  await transporter.sendMail({
    from,
    to,
    subject,
    html
  });
}

/** Logs whether SMTP auth works; call once at startup. */
export async function verifyMailConfig() {
  try {
    if (!process.env.EMAIL_USER && !process.env.SMTP_HOST) {
      console.warn('[mail] No EMAIL_* / SMTP_* env; outgoing mail is disabled.');
      return;
    }
    const t = getTransport();
    await t.verify();
    console.log('[mail] SMTP ready (', process.env.SMTP_HOST || 'smtp.gmail.com', ').');
  } catch (e) {
    console.error('[mail] SMTP verify failed:', e?.message || e);
    console.error(
      '[mail] Gmail: use a 16-character App Password (Google Account → Security → App passwords). Paste with or without spaces; wrong account password gives 535.'
    );
  }
}
