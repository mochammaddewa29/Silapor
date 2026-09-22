const Brevo = require('@getbrevo/brevo');

/**
 * Kirim OTP ke email user menggunakan Brevo (SendinBlue)
 * @param {string} toEmail - Alamat email tujuan
 * @param {string} otp - Kode OTP 6 digit
 * @param {string} fullName - Nama lengkap user
 */
exports.sendOTPEmail = async (toEmail, otp, fullName) => {
  const apiInstance = new Brevo.TransactionalEmailsApi();

  // Set API Key dari environment variable
  const apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: 'Lapor JakBan',
    email: process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'no-reply@laporjakban.com',
  };

  sendSmtpEmail.to = [{ email: toEmail, name: fullName }];

  sendSmtpEmail.subject = 'Kode Verifikasi OTP Anda - Lapor JakBan';

  sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode OTP Lapor JakBan</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0B1E3F 0%,#1E88E5 100%);padding:40px 48px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;background:#FFC107;border-radius:14px;width:56px;height:56px;margin-bottom:16px;">
                <span style="font-size:28px;">⚡</span>
              </div>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:1px;">
                Lapor<span style="background:#FFC107;color:#0B1E3F;border-radius:6px;padding:2px 8px;margin-left:6px;font-size:14px;font-weight:900;">JakBan</span>
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Sistem Pelaporan Terpadu & Terintegrasi</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Verifikasi Pendaftaran</p>
              <h2 style="margin:0 0 20px;color:#0f172a;font-size:22px;font-weight:800;">Halo, ${fullName}! 👋</h2>
              <p style="margin:0 0 32px;color:#475569;font-size:15px;line-height:1.7;">
                Terima kasih telah mendaftar di <strong>Lapor JakBan</strong>. Gunakan kode OTP berikut untuk menyelesaikan pendaftaran akun Anda:
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #bae6fd;border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;color:#0369a1;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Kode Verifikasi OTP</p>
                <div style="font-size:48px;font-weight:900;letter-spacing:12px;color:#0B1E3F;font-family:'Courier New',monospace;">${otp}</div>
                <p style="margin:12px 0 0;color:#64748b;font-size:12px;">
                  ⏰ Kode ini berlaku selama <strong>5 menit</strong>
                </p>
              </div>

              <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;padding:16px;margin-bottom:32px;">
                <p style="margin:0;color:#9a3412;font-size:13px;line-height:1.6;">
                  ⚠️ <strong>Jangan bagikan kode ini</strong> kepada siapapun. Tim Lapor JakBan tidak pernah meminta kode OTP Anda.
                </p>
              </div>

              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                Jika Anda tidak merasa mendaftar di Lapor JakBan, abaikan email ini.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 48px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© 2026 Lapor JakBan — Respon Tanggap 24/7</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};
