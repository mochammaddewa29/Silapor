// URL Logo resmi Lapor JakBan (CDN Vercel Blob)
const LOGO_ICON_URL = 'https://x0dpjdlo7g36tofw.public.blob.vercel-storage.com/assets/logo-icon.png';

/**
 * Kirim OTP ke email user menggunakan Brevo REST API
 * @param {string} toEmail - Alamat email tujuan
 * @param {string} otp - Kode OTP 6 digit
 * @param {string} fullName - Nama lengkap user
 */
exports.sendOTPEmail = async (toEmail, otp, fullName) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'no-reply@laporjakban.com';

  // Pecah OTP jadi per-digit untuk tampilan kotak individu
  const otpDigits = otp.split('');
  const otpBoxes = otpDigits.map(d =>
    `<td style="width:48px;height:56px;background:#ffffff;border:2px solid #1E88E5;border-radius:12px;text-align:center;vertical-align:middle;font-family:'Courier New',monospace;font-size:32px;font-weight:900;color:#0B1E3F;letter-spacing:0;box-shadow:0 2px 8px rgba(30,136,229,0.12);">${d}</td>`
  ).join('<td style="width:8px;"></td>');

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Kode OTP - Lapor JakBan</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
  <style>
    :root { color-scheme: light dark; }
    @media (prefers-color-scheme: dark) {
      .dm-bg { background-color: #0F172A !important; }
      .dm-card { background-color: #1E293B !important; border-color: #334155 !important; }
      .dm-body { background-color: #1E293B !important; }
      .dm-h2 { color: #F1F5F9 !important; }
      .dm-p { color: #94A3B8 !important; }
      .dm-otp { background-color: #0F172A !important; border-color: #334155 !important; }
      .dm-badge { background-color: #1E3A5F !important; border-color: #1E40AF !important; }
      .dm-badge-text { color: #60A5FA !important; }
      .dm-warn { background-color: #1C1100 !important; border-color: #92400E !important; }
      .dm-warn-title { color: #FBBF24 !important; }
      .dm-warn-text { color: #D97706 !important; }
      .dm-footer { background-color: #0F172A !important; border-color: #1E293B !important; }
      .dm-footer-text { color: #475569 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  
  <!-- Preheader (hidden text for email preview) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Kode verifikasi OTP Anda: ${otp} — Berlaku 5 menit. Jangan bagikan kode ini.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#0B1E3F 0%,#1565C0 50%,#1E88E5 100%);padding:36px 32px 32px;text-align:center;">
              <!-- Logo Icon -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:16px;">
                <tr>
                  <td align="center" style="width:64px;height:64px;">
                    <img src="${LOGO_ICON_URL}" width="64" height="64" alt="Lapor JakBan Logo" style="display:block;width:64px;height:64px;border:0;outline:none;text-decoration:none;border-radius:18px;box-shadow:0 6px 20px rgba(255,193,7,0.4);" />
                  </td>
                </tr>
              </table>
              <!-- Brand Name -->
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:1px;padding-right:8px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;">Lapor</td>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0" style="background:#FFC107;border-radius:6px;">
                      <tr>
                        <td style="padding:3px 9px;color:#0B1E3F;font-size:13px;font-weight:900;letter-spacing:0.5px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;text-transform:uppercase;">JAKBAN</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;color:#BAE6FD;font-size:12px;font-weight:600;letter-spacing:0.5px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;">SISTEM PELAPORAN TERPADU &amp; TERINTEGRASI</p>
            </td>
          </tr>

          <!-- Divider Accent Line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#FFC107,#1E88E5,#FFC107);"></td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:40px 32px 24px;">
              <!-- Badge -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#EFF6FF;border-radius:20px;padding:6px 14px;border:1px solid #BFDBFE;">
                    <span style="color:#1D4ED8;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">&#128274; Verifikasi Akun Baru</span>
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 12px;color:#0F172A;font-size:22px;font-weight:800;line-height:1.3;">
                Halo, ${fullName}!
              </h2>
              <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">
                Terima kasih telah mendaftar di <strong style="color:#0F172A;">Lapor JakBan</strong>. Masukkan kode verifikasi di bawah ini untuk mengaktifkan akun Anda.
              </p>

              <!-- OTP Code Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:28px 16px;margin-bottom:24px;">
                <tr>
                  <td style="text-align:center;padding-bottom:16px;">
                    <span style="color:#64748B;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">KODE VERIFIKASI OTP</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <!-- OTP Digit Boxes -->
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        ${otpBoxes}
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;">
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td style="padding-right:6px;">
                          <span style="font-size:14px;">&#9200;</span>
                        </td>
                        <td>
                          <span style="color:#64748B;font-size:12px;font-weight:500;">Berlaku selama <strong style="color:#D97706;">5 menit</strong></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:10px;padding-top:1px;">
                          <span style="font-size:16px;">&#128272;</span>
                        </td>
                        <td>
                          <p style="margin:0;color:#B45309;font-size:13px;font-weight:700;line-height:1.5;">Keamanan Akun Anda</p>
                          <p style="margin:4px 0 0;color:#78350F;font-size:12px;line-height:1.6;">
                            Jangan bagikan kode ini kepada siapa pun. Tim <strong style="color:#451A03;">Lapor JakBan</strong> tidak pernah meminta kode OTP melalui pesan atau telepon.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Info Text -->
              <p style="margin:0;color:#64748B;font-size:12px;line-height:1.6;text-align:center;">
                Jika Anda tidak merasa mendaftar, abaikan email ini.<br>Tidak ada tindakan lebih lanjut yang diperlukan.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F1F5F9;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:8px;">
                <tr>
                  <td style="font-size:14px;font-weight:900;color:#475569;letter-spacing:0.5px;padding-right:4px;">Lapor</td>
                  <td>
                    <span style="display:inline-block;background:#CBD5E1;color:#1E293B;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;letter-spacing:0.5px;">JakBan</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#64748B;font-size:11px;">© 2026 Lapor JakBan — Respon Tanggap 24/7</p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin-top:16px;">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0;color:#94A3B8;font-size:10px;line-height:1.5;">
                Email ini dikirim secara otomatis oleh sistem Lapor JakBan.<br>
                Mohon tidak membalas email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Lapor JakBan', email: senderEmail },
      to: [{ email: toEmail, name: fullName }],
      subject: `🔐 Kode OTP Anda: ${otp} — Lapor JakBan`,
      htmlContent: htmlContent
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Brevo API Error:', errorData);
    const error = new Error('Failed to send email');
    error.response = { status: response.status };
    throw error;
  }
};

/**
 * Kirim OTP Reset Password ke email user
 * @param {string} toEmail - Alamat email tujuan
 * @param {string} otp - Kode OTP 6 digit
 * @param {string} fullName - Nama lengkap user
 */
exports.sendResetPasswordEmail = async (toEmail, otp, fullName) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'no-reply@laporjakban.com';

  const otpDigits = otp.split('');
  const otpBoxes = otpDigits.map(d =>
    `<td style="width:48px;height:56px;background:#ffffff;border:2px solid #F59E0B;border-radius:12px;text-align:center;vertical-align:middle;font-family:'Courier New',monospace;font-size:32px;font-weight:900;color:#0B1E3F;letter-spacing:0;box-shadow:0 2px 8px rgba(245,158,11,0.15);">${d}</td>`
  ).join('<td style="width:8px;"></td>');

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Reset Password - Lapor JakBan</title>
  <style>
    :root { color-scheme: light dark; }
    @media (prefers-color-scheme: dark) {
      .dm-bg { background-color: #0F172A !important; }
      .dm-card { background-color: #1E293B !important; border-color: #334155 !important; }
      .dm-body { background-color: #1E293B !important; }
      .dm-h2 { color: #F1F5F9 !important; }
      .dm-p { color: #94A3B8 !important; }
      .dm-otp { background-color: #0F172A !important; border-color: #334155 !important; }
      .dm-badge { background-color: #431407 !important; border-color: #7C2D12 !important; }
      .dm-badge-text { color: #FB923C !important; }
      .dm-warn { background-color: #1A0000 !important; border-color: #7F1D1D !important; }
      .dm-warn-title { color: #FCA5A5 !important; }
      .dm-warn-text { color: #FECACA !important; }
      .dm-footer { background-color: #0F172A !important; border-color: #1E293B !important; }
      .dm-footer-text { color: #475569 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Kode reset password Anda: ${otp} — Berlaku 5 menit. Jangan bagikan kode ini.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0B1E3F 0%,#1565C0 60%,#1E88E5 100%);padding:36px 32px 32px;text-align:center;">
              <!-- Logo Icon -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:16px;">
                <tr>
                  <td align="center" style="width:64px;height:64px;">
                    <img src="${LOGO_ICON_URL}" width="64" height="64" alt="Lapor JakBan Logo" style="display:block;width:64px;height:64px;border:0;outline:none;text-decoration:none;border-radius:18px;box-shadow:0 6px 20px rgba(255,193,7,0.4);" />
                  </td>
                </tr>
              </table>
              <!-- Brand Name -->
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:1px;padding-right:8px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;">Lapor</td>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0" style="background:#FFC107;border-radius:6px;">
                      <tr>
                        <td style="padding:3px 9px;color:#0B1E3F;font-size:13px;font-weight:900;letter-spacing:0.5px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;text-transform:uppercase;">JAKBAN</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;color:#BAE6FD;font-size:12px;font-weight:600;letter-spacing:0.5px;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;">RESET PASSWORD AKUN</p>
            </td>
          </tr>

          <!-- Accent Line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#FFC107,#1E88E5,#FFC107);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px 24px;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#FFF7ED;border-radius:20px;padding:6px 14px;border:1px solid #FFEDD5;">
                    <span style="color:#C2410C;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">&#128275; Reset Password</span>
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 12px;color:#0F172A;font-size:22px;font-weight:800;line-height:1.3;">
                Halo, ${fullName}!
              </h2>
              <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.7;">
                Kami menerima permintaan untuk mereset password akun <strong style="color:#0F172A;">Lapor JakBan</strong> Anda. Masukkan kode verifikasi di bawah ini untuk membuat password baru.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:28px 16px;margin-bottom:24px;">
                <tr>
                  <td style="text-align:center;padding-bottom:16px;">
                    <span style="color:#64748B;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">KODE RESET PASSWORD</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        ${otpBoxes}
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;">
                    <table cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td style="padding-right:6px;">
                          <span style="font-size:14px;">&#9200;</span>
                        </td>
                        <td>
                          <span style="color:#64748B;font-size:12px;font-weight:500;">Berlaku selama <strong style="color:#D97706;">5 menit</strong></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:10px;padding-top:1px;">
                          <span style="font-size:16px;">&#128272;</span>
                        </td>
                        <td>
                          <p style="margin:0;color:#B91C1C;font-size:13px;font-weight:700;line-height:1.5;">Bukan Anda yang meminta?</p>
                          <p style="margin:4px 0 0;color:#7F1D1D;font-size:12px;line-height:1.6;">
                            Jika Anda tidak meminta reset password, abaikan email ini. Password Anda akan tetap aman.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#64748B;font-size:12px;line-height:1.6;text-align:center;">
                Demi keamanan, jangan bagikan kode ini kepada siapa pun.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F1F5F9;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:8px;">
                <tr>
                  <td style="font-size:14px;font-weight:900;color:#475569;letter-spacing:0.5px;padding-right:4px;">Lapor</td>
                  <td>
                    <span style="display:inline-block;background:#CBD5E1;color:#1E293B;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;letter-spacing:0.5px;">JakBan</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#64748B;font-size:11px;">© 2026 Lapor JakBan — Respon Tanggap 24/7</p>
            </td>
          </tr>

        </table>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin-top:16px;">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0;color:#94A3B8;font-size:10px;line-height:1.5;">
                Email ini dikirim secara otomatis oleh sistem Lapor JakBan.<br>
                Mohon tidak membalas email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Lapor JakBan', email: senderEmail },
      to: [{ email: toEmail, name: fullName }],
      subject: `🔑 Reset Password: ${otp} — Lapor JakBan`,
      htmlContent: htmlContent
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Brevo API Error:', errorData);
    const error = new Error('Failed to send email');
    error.response = { status: response.status };
    throw error;
  }
};


