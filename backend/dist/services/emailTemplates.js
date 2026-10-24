/**
 * Enterprise Responsive Email Templates for Veuz Safety E-Commerce
 * - Pure Black & Crisp Neutral Theme (Zero purple)
 * - Uses official Veuz Logo Image (No extra text)
 * - Cross-client bulletproof HTML/CSS badges (Never stripped by Gmail/Outlook)
 * - Standard, pixel-perfect alignment
 * - Zero raw token link leaks (Hidden behind clean anchor tags)
 */
// ========================================================
// 1. PASSWORD RESET TEMPLATE
// ========================================================
export const getResetPasswordEmailHtml = (name, resetLink, clientUrl, otp) => {
    const recipientName = name && name.trim() ? name.trim() : 'Customer';
    const displayOtp = otp && otp.trim() ? otp.trim() : '------';
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset your password - Veuz Safety</title>
  <style>
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #f4f5f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
      border-collapse: collapse !important;
    }
    @media only screen and (max-width: 620px) {
      .email-card-body {
        padding: 28px 18px !important;
      }
      .code-display {
        font-size: 26px !important;
        letter-spacing: 6px !important;
      }
      .btn-cta {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; background-color: #f4f5f8;">
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your password reset OTP code is ${displayOtp}. Use this code to reset your password on Veuz Safety.
  </div>

  <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f5f8; margin: 0 auto; width: 100%;">
    <tr>
      <td align="center" valign="top" style="padding: 40px 16px;">
        <!-- Main Card Container -->
        <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); margin: 0 auto;">
          <tr>
            <td class="email-card-body" style="padding: 38px 34px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                
                <!-- Veuz Logo Header (Centered with generous top padding) -->
                <tr>
                  <td align="center" style="padding-top: 10px; padding-bottom: 22px;">
                    <a href="${clientUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
                      <img src="cid:veuz-logo" alt="Veuz Safety" height="38" style="height: 38px; max-height: 38px; width: auto; display: block; margin: 0 auto; border: 0;" />
                    </a>
                  </td>
                </tr>

                <!-- Circular Blue Lock Badge -->
                <tr>
                  <td align="center" style="padding-bottom: 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td align="center" valign="middle" style="width: 56px; height: 56px; background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 50%; text-align: center;">
                          <img src="cid:email-icon-lock" alt="Reset Password" width="26" height="26" style="width: 26px; height: 26px; display: block; margin: 0 auto; border: 0;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.25; letter-spacing: -0.02em;">
                      Reset your password
                    </h1>
                  </td>
                </tr>

                <!-- Subtitle / Greeting -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 14.5px; color: #64748b; line-height: 1.55; max-width: 440px;">
                      Hello <strong>${recipientName}</strong>, we received a request to reset your password for your account at <strong>veuz-safety.com</strong>.
                    </p>
                  </td>
                </tr>

                <!-- Inner Card / OTP Box Section -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table class="inner-box" role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto;">
                      <tr>
                        <td style="padding: 28px 22px;" align="center">
                          
                          <!-- OTP Label -->
                          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px;">
                            YOUR 6-DIGIT PASSWORD RESET OTP:
                          </p>

                          <!-- 6-Digit Code Box -->
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto;">
                            <tr>
                              <td align="center" style="background-color: #ffffff; border: 2px dashed #0f172a; border-radius: 10px; padding: 12px 28px;">
                                <span class="code-display" style="font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: 8px; font-family: -apple-system, BlinkMacSystemFont, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; display: inline-block; padding-left: 8px;">
                                  ${displayOtp}
                                </span>
                              </td>
                            </tr>
                          </table>

                          <p style="margin: 0 0 20px 0; font-size: 13.5px; color: #475569; line-height: 1.5;">
                            Confirm this OTP code on the reset password screen to unlock and create your new password.
                          </p>

                          <!-- Primary CTA Button (Solid Black) -->
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                            <tr>
                              <td align="center">
                                <a href="${resetLink}" class="btn-cta" target="_blank" style="background-color: #0f172a; color: #ffffff; display: inline-block; font-size: 14.5px; font-weight: 600; text-align: center; text-decoration: none; padding: 13px 44px; border-radius: 8px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.16); letter-spacing: 0.2px;">
                                  Reset Password Directly
                                </a>
                              </td>
                            </tr>
                          </table>

                          <!-- Subtle Divider -->
                          <div style="height: 1px; background-color: #e2e8f0; width: 100%; margin: 22px 0 16px 0;"></div>

                          <!-- 15m Expiry Notice -->
                          <p style="margin: 0 0 8px 0; font-size: 12.5px; color: #475569; font-weight: 600;">
                            ⏱️ This OTP code is only valid for 15 minutes.
                          </p>

                          <!-- Security Notice -->
                          <p style="margin: 0; font-size: 11.5px; line-height: 1.55; color: #94a3b8; max-width: 420px;">
                            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                          </p>

                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Support Inquiry Section -->
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 600; color: #0f172a;">
                      Have any questions?
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      Visit our <a href="${clientUrl}" target="_blank" style="color: #0f172a; font-weight: 700; text-decoration: underline;">Support Service</a>.
                    </p>
                  </td>
                </tr>

                <!-- Footer Disclaimers & Copyright -->
                <tr>
                  <td style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 11px; line-height: 1.55; color: #94a3b8;" align="center">
                    <p style="margin: 0 0 6px 0;">
                      Please do not reply to this email. This mailbox is not monitored.
                    </p>
                    <p style="margin: 0; color: #cbd5e1;">
                      Copyright &copy; ${new Date().getFullYear()} Veuz. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
// ========================================================
// 2. WELCOME / REGISTRATION SUCCESS TEMPLATE
// ========================================================
export const getWelcomeEmailHtml = (name, clientUrl) => {
    const recipientName = name && name.trim() ? name.trim() : 'Customer';
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Account Created Successfully - Veuz Safety</title>
  <style>
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #f4f5f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
      border-collapse: collapse !important;
    }
    @media only screen and (max-width: 620px) {
      .email-card-body {
        padding: 28px 18px !important;
      }
      .btn-cta {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; background-color: #f4f5f8;">
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your Veuz Safety account has been created successfully.
  </div>

  <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f5f8; margin: 0 auto; width: 100%;">
    <tr>
      <td align="center" valign="top" style="padding: 40px 16px;">
        <!-- Main Card Container -->
        <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); margin: 0 auto;">
          <tr>
            <td class="email-card-body" style="padding: 38px 34px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                
                <!-- Veuz Logo Header (Centered with generous top padding) -->
                <tr>
                  <td align="center" style="padding-top: 10px; padding-bottom: 24px;">
                    <a href="${clientUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
                      <img src="cid:veuz-logo" alt="Veuz Safety" height="38" style="height: 38px; max-height: 38px; width: auto; display: block; margin: 0 auto; border: 0;" />
                    </a>
                  </td>
                </tr>

                <!-- Bulletproof Circular Success Check Badge -->
                <tr>
                  <td align="center" style="padding-bottom: 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td align="center" valign="middle" style="width: 56px; height: 56px; background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 50%; text-align: center;">
                          <img src="cid:email-icon-check" alt="Account Created" width="26" height="26" style="width: 26px; height: 26px; display: block; margin: 0 auto; border: 0;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Centered Big Headline -->
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Account created successfully
                    </h1>
                  </td>
                </tr>

                <!-- Centered Body Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0 0 14px 0; font-size: 15px; color: #475569; line-height: 1.6; max-width: 460px;">
                      Welcome aboard, <strong>${recipientName}</strong>! Your account at <strong>Veuz Safety</strong> is active and ready to use.
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b; line-height: 1.6; max-width: 440px;">
                      You can browse certified personal protective equipment (PPE), place orders with real-time tracking, and manage your delivery addresses.
                    </p>

                    <!-- Verification Notice Box (Please verify email in profile) -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 12px 0 0 0;">
                      <tr>
                        <td align="center" style="padding: 14px 18px; font-size: 13.5px; color: #1e293b; line-height: 1.5;">
                          🛡️ <strong>Next Step:</strong> Please verify your email in your profile to secure your account.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Action Button with Solid Black Color (#0f172a) -->
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <a href="${clientUrl}/profile#basic-info" class="btn-cta" target="_blank" style="background-color: #0f172a; color: #ffffff; display: inline-block; font-size: 14.5px; font-weight: 600; text-align: center; text-decoration: none; padding: 13px 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.16); letter-spacing: 0.2px;">
                      Go to Profile to Verify Email
                    </a>
                  </td>
                </tr>

                <!-- Help Inquiry Section -->
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 600; color: #0f172a;">
                      Have any questions?
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      Visit our <a href="${clientUrl}" target="_blank" style="color: #0f172a; font-weight: 700; text-decoration: underline;">Support Service</a>.
                    </p>
                  </td>
                </tr>

                <!-- Footer Disclaimers & Copyright -->
                <tr>
                  <td style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 11px; line-height: 1.55; color: #94a3b8;" align="center">
                    <p style="margin: 0 0 6px 0;">
                      This is an automated communication from Veuz Safety E-Commerce.
                    </p>
                    <p style="margin: 0; color: #cbd5e1;">
                      Copyright &copy; ${new Date().getFullYear()} Veuz. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
// ========================================================
// 3. EMAIL VERIFICATION (With 6-Digit Code)
// ========================================================
export const getVerificationEmailHtml = (name, verificationLink, clientUrl, code) => {
    const recipientName = name && name.trim() ? name.trim() : 'Customer';
    const displayCode = code && code.trim() ? code.trim() : '------';
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify your email - Veuz Safety</title>
  <style>
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #f4f5f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
      border-collapse: collapse !important;
    }
    @media only screen and (max-width: 620px) {
      .email-card-body {
        padding: 28px 18px !important;
      }
      .code-display {
        font-size: 26px !important;
        letter-spacing: 6px !important;
      }
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; background-color: #f4f5f8;">
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your confirmation code is ${displayCode}. Enter this code in your profile to verify your email on Veuz Safety.
  </div>

  <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f5f8; margin: 0 auto; width: 100%;">
    <tr>
      <td align="center" valign="top" style="padding: 40px 16px;">
        <!-- Main Card Container -->
        <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); margin: 0 auto;">
          <tr>
            <td class="email-card-body" style="padding: 38px 34px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                
                <!-- Veuz Logo Header (Centered with generous top padding) -->
                <tr>
                  <td align="center" style="padding-top: 10px; padding-bottom: 22px;">
                    <a href="${clientUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
                      <img src="cid:veuz-logo" alt="Veuz Safety" height="38" style="height: 38px; max-height: 38px; width: auto; display: block; margin: 0 auto; border: 0;" />
                    </a>
                  </td>
                </tr>

                <!-- Circular Blue Envelope Badge -->
                <tr>
                  <td align="center" style="padding-bottom: 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td align="center" valign="middle" style="width: 56px; height: 56px; background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 50%; text-align: center;">
                          <img src="cid:email-icon-envelope" alt="Verify Email" width="26" height="26" style="width: 26px; height: 26px; display: block; margin: 0 auto; border: 0;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.25; letter-spacing: -0.02em;">
                      Verify your email
                    </h1>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 14.5px; color: #64748b; line-height: 1.55; max-width: 440px;">
                      Welcome <strong>${recipientName}</strong>! Please use the confirmation code below to verify your email.
                    </p>
                  </td>
                </tr>

                <!-- Inner Activation Card -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table class="inner-box" role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto;">
                      <tr>
                        <td style="padding: 26px 20px;" align="center">
                          
                          <!-- Label -->
                          <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px;">
                            YOUR 6-DIGIT VERIFICATION CODE:
                          </p>

                          <!-- 6-Digit Code Box -->
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                            <tr>
                              <td align="center" style="background-color: #ffffff; border: 2px dashed #0f172a; border-radius: 10px; padding: 12px 28px;">
                                <span class="code-display" style="font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: 8px; font-family: -apple-system, BlinkMacSystemFont, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; display: inline-block; padding-left: 8px;">
                                  ${displayCode}
                                </span>
                              </td>
                            </tr>
                          </table>

                          <!-- Instructional Text -->
                          <p style="margin: 14px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                            Enter this code in your profile to complete email verification.
                          </p>

                          <!-- Subtle Divider -->
                          <div style="height: 1px; background-color: #e2e8f0; width: 100%; margin: 20px 0 16px 0;"></div>

                          <!-- 24h Expiry Notice -->
                          <p style="margin: 0 0 8px 0; font-size: 12.5px; color: #475569; font-weight: 600;">
                            ⏱️ This code is only valid for 24 hours.
                          </p>

                          <!-- Resend Guidance Note -->
                          <p style="margin: 0; font-size: 11.5px; line-height: 1.55; color: #94a3b8; max-width: 420px;">
                            If you requested a new verification email, please make sure you use the code from the most recent email. Older codes will be considered invalid.
                          </p>

                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Support Inquiry Section -->
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 600; color: #0f172a;">
                      Didn't create an account with Veuz Safety?
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      Let us know immediately by visiting our <a href="${clientUrl}" target="_blank" style="color: #0f172a; font-weight: 700; text-decoration: underline;">Support Service</a>.
                    </p>
                  </td>
                </tr>

                <!-- Footer Disclaimers & Copyright -->
                <tr>
                  <td style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 11px; line-height: 1.55; color: #94a3b8;" align="center">
                    <p style="margin: 0 0 6px 0;">
                      This is an automated communication from Veuz Safety E-Commerce.
                    </p>
                    <p style="margin: 0; color: #cbd5e1;">
                      Copyright &copy; ${new Date().getFullYear()} Veuz. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
// ========================================================
// 4. PASSWORD RESET SUCCESS CONFIRMATION
// ========================================================
export const getPasswordResetSuccessEmailHtml = (name, clientUrl) => {
    const recipientName = name && name.trim() ? name.trim() : 'Customer';
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Password changed successfully - Veuz Safety</title>
  <style>
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #f4f5f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
      border-collapse: collapse !important;
    }
    @media only screen and (max-width: 620px) {
      .email-card-body {
        padding: 28px 18px !important;
      }
      .btn-cta {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; background-color: #f4f5f8;">
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your password has been changed successfully for your Veuz Safety account.
  </div>

  <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f5f8; margin: 0 auto; width: 100%;">
    <tr>
      <td align="center" valign="top" style="padding: 40px 16px;">
        <!-- Main Card Container -->
        <table class="email-card" role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); margin: 0 auto;">
          <tr>
            <td class="email-card-body" style="padding: 38px 34px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                
                <!-- Veuz Logo Header (Centered with generous top padding) -->
                <tr>
                  <td align="center" style="padding-top: 10px; padding-bottom: 22px;">
                    <a href="${clientUrl}" target="_blank" style="display: inline-block; text-decoration: none;">
                      <img src="cid:veuz-logo" alt="Veuz Safety" height="38" style="height: 38px; max-height: 38px; width: auto; display: block; margin: 0 auto; border: 0;" />
                    </a>
                  </td>
                </tr>

                <!-- Bulletproof Circular Success Check Badge -->
                <tr>
                  <td align="center" style="padding-bottom: 18px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td align="center" valign="middle" style="width: 56px; height: 56px; background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 50%; text-align: center;">
                          <img src="cid:email-icon-check" alt="Password Reset Successful" width="26" height="26" style="width: 26px; height: 26px; display: block; margin: 0 auto; border: 0;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.25; letter-spacing: -0.02em;">
                      Password changed successfully
                    </h1>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 14.5px; color: #64748b; line-height: 1.55; max-width: 440px;">
                      Hello <strong>${recipientName}</strong>, the password for your <strong>Veuz Safety</strong> account was changed successfully.
                    </p>
                  </td>
                </tr>

                <!-- Action Button in Solid Black (#0f172a) -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td align="center">
                          <a href="${clientUrl}/login" class="btn-cta" target="_blank" style="background-color: #0f172a; color: #ffffff; display: inline-block; font-size: 14.5px; font-weight: 600; text-align: center; text-decoration: none; padding: 13px 44px; border-radius: 8px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.16); letter-spacing: 0.2px;">
                            Sign in to your account
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Security Alert Box -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; margin: 0 auto;">
                      <tr>
                        <td style="padding: 14px 18px; font-size: 12.5px; line-height: 1.55; color: #991b1b; text-align: center;">
                          <strong>Security Notice:</strong> If you did not make this change, please contact our <a href="${clientUrl}" target="_blank" style="color: #991b1b; font-weight: 700; text-decoration: underline;">Support Service</a> immediately.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer Disclaimers & Copyright -->
                <tr>
                  <td style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 11px; line-height: 1.55; color: #94a3b8;" align="center">
                    <p style="margin: 0 0 6px 0;">
                      This is an automated security communication from Veuz Safety E-Commerce.
                    </p>
                    <p style="margin: 0; color: #cbd5e1;">
                      Copyright &copy; ${new Date().getFullYear()} Veuz. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
// ========================================================
// 5. ADMIN / STAFF TEAM INVITATION
// ========================================================
export const getAdminInviteEmailHtml = (email, role, inviteLink, clientUrl) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to join Veuz Safety</title>
  <style>
    body { margin:0; padding:0; background-color:#f4f5f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media only screen and (max-width: 620px) {
      .email-card { width:100% !important; border-radius:0 !important; padding:32px 18px !important; }
      .btn-cta { display:block !important; width:100% !important; box-sizing:border-box !important; text-align:center !important; }
    }
  </style>
</head>
<body style="background-color:#f4f5f8; margin:0; padding:40px 12px;">
  <table align="center" role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table class="email-card" role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width:580px; width:100%; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; padding:42px 44px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${clientUrl}" target="_blank" style="display:inline-block; text-decoration:none;">
                <img src="cid:veuz-logo" alt="Veuz Safety" height="38" style="height: 38px; max-height: 38px; width: auto; display: block; margin: 0 auto; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- Team Badge Icon -->
          <tr>
            <td align="center" style="padding-bottom: 18px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" valign="middle" style="width: 56px; height: 56px; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 50%; text-align: center;">
                    <img src="cid:email-icon-team" alt="Team Invitation" width="26" height="26" style="width: 26px; height: 26px; display: block; margin: 0 auto; border: 0;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0; font-size:24px; font-weight:700; color:#0f172a; line-height:1.3;">
                Team invitation
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="font-size:14.5px; line-height:1.65; color:#334155; text-align:left; padding-bottom:28px;">
              <p style="margin:0 0 16px 0; font-weight:600; color:#0f172a;">Hello,</p>
              <p style="margin:0 0 16px 0; color:#475569;">
                You have been invited to join the <strong>Veuz Safety E-Commerce</strong> team as an <strong>${role}</strong>.
              </p>
              <p style="margin:0; color:#475569;">
                To accept this invitation and configure your administrative account credentials, click the button below. Please note that the link is valid for 7 days.
              </p>
            </td>
          </tr>

          <!-- CTA Button (Black) -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <a href="${inviteLink}" class="btn-cta" target="_blank" style="background-color:#0f172a; color:#ffffff; display:inline-block; font-size:14.5px; font-weight:600; text-align:center; text-decoration:none; padding:13px 44px; border-radius:8px; box-shadow:0 4px 12px rgba(15,23,42,0.16);">
                Set up account
              </a>
            </td>
          </tr>

          <!-- Fallback Clean Link -->
          <tr>
            <td align="center" style="padding-bottom:32px; font-size:13px; color:#64748b;">
              Can't see the button? Use the link: <a href="${inviteLink}" target="_blank" style="color:#0f172a; font-weight:700; text-decoration:underline;">[link here]</a>
            </td>
          </tr>

          <!-- Sign Off -->
          <tr>
            <td style="font-size:14px; line-height:1.6; color:#475569; text-align:left; padding-bottom:26px;">
              Yours sincerely,<br>
              <strong style="color:#0f172a;">Veuz Team</strong>
            </td>
          </tr>

          <!-- Support Box -->
          <tr>
            <td style="padding-bottom:28px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
                <tr>
                  <td style="padding:14px 18px; font-size:13px; line-height:1.5; color:#475569; text-align:center;">
                    If you have additional questions, please refer to the <a href="${clientUrl}" target="_blank" style="color:#0f172a; font-weight:700; text-decoration:underline;">Support Service</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #f1f5f9; padding-top:22px; text-align:center; font-size:11px; line-height:1.55; color:#94a3b8;">
              <p style="margin:0 0 6px 0;">This is an automated communication from Veuz Safety E-Commerce.</p>
              <p style="margin:0; color:#cbd5e1;">Copyright &copy; ${new Date().getFullYear()} Veuz. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
