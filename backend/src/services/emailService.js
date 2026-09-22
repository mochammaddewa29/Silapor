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
  <title>Kode OTP - Lapor JakBan</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0F172A;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  
  <!-- Preheader (hidden text for email preview) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    Kode verifikasi OTP Anda: ${otp} — Berlaku 5 menit. Jangan bagikan kode ini.
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0F172A;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#1E293B;border-radius:20px;overflow:hidden;border:1px solid #334155;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#0B1E3F 0%,#1565C0 50%,#1E88E5 100%);padding:36px 32px 32px;text-align:center;">
              <!-- Logo Icon -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:16px;">
                <tr>
                  <td style="width:52px;height:52px;background:#FFC107;border-radius:14px;text-align:center;vertical-align:middle;box-shadow:0 4px 16px rgba(255,193,7,0.3);">
                    <span style="font-size:26px;line-height:52px;">&#9889;</span>
                  </td>
                </tr>
              </table>
              <!-- Brand Name -->
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:1.5px;padding-right:6px;">Lapor</td>
                  <td>
                    <span style="display:inline-block;background:#FFC107;color:#0B1E3F;border-radius:6px;padding:3px 10px;font-size:13px;font-weight:900;letter-spacing:0.5px;">JakBan</span>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;color:#93C5FD;font-size:12px;font-weight:500;letter-spacing:0.5px;">SISTEM PELAPORAN TERPADU &amp; TERINTEGRASI</p>
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
                  <td style="background:#1E3A5F;border-radius:20px;padding:6px 14px;">
                    <span style="color:#60A5FA;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">&#128274; Verifikasi Akun Baru</span>
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 12px;color:#F8FAFC;font-size:22px;font-weight:800;line-height:1.3;">
                Halo, ${fullName}!
              </h2>
              <p style="margin:0 0 28px;color:#94A3B8;font-size:14px;line-height:1.7;">
                Terima kasih telah mendaftar di <strong style="color:#E2E8F0;">Lapor JakBan</strong>. Masukkan kode verifikasi di bawah ini untuk mengaktifkan akun Anda.
              </p>

              <!-- OTP Code Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0F172A;border:1px solid #334155;border-radius:16px;padding:28px 16px;margin-bottom:24px;">
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
                          <span style="color:#94A3B8;font-size:12px;font-weight:500;">Berlaku selama <strong style="color:#FFC107;">5 menit</strong></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:top;padding-right:10px;padding-top:1px;">
                          <span style="font-size:16px;">&#128272;</span>
                        </td>
                        <td>
                          <p style="margin:0;color:#FBBF24;font-size:13px;font-weight:700;line-height:1.5;">Keamanan Akun Anda</p>
                          <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;line-height:1.6;">
                            Jangan bagikan kode ini kepada siapa pun. Tim <strong style="color:#CBD5E1;">Lapor JakBan</strong> tidak pernah meminta kode OTP melalui pesan atau telepon.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Info Text -->
              <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;text-align:center;">
                Jika Anda tidak merasa mendaftar, abaikan email ini.<br>Tidak ada tindakan lebih lanjut yang diperlukan.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0F172A;border-top:1px solid #1E293B;padding:20px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:8px;">
                <tr>
                  <td style="font-size:14px;font-weight:900;color:#64748B;letter-spacing:0.5px;padding-right:4px;">Lapor</td>
                  <td>
                    <span style="display:inline-block;background:#334155;color:#94A3B8;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:800;letter-spacing:0.5px;">JakBan</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#475569;font-size:11px;">© 2026 Lapor JakBan — Respon Tanggap 24/7</p>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin-top:16px;">
          <tr>
            <td style="text-align:center;">
              <p style="margin:0;color:#334155;font-size:10px;line-height:1.5;">
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
