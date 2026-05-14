package com.esprit.campconnect.common;

import org.springframework.stereotype.Service;

@Service
public class LivraisonEmailTemplateService {

    public String buildLivreurTipReceivedEmail(
            String livreurName,
            Long livraisonId,
            Double tipAmount,
            Integer rating,
            String comment
    ) {
        String safeName = livreurName != null ? livreurName : "Livreur";
        String safeComment = comment != null && !comment.isBlank()
                ? comment
                : "No comment";

        return """
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#EDE7DE;font-family:Arial,sans-serif;color:#1C1C1C;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#EDE7DE;padding:24px 0;">
            <tr>
              <td align="center">
                <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#F7F3ED;border:1px solid #CFC6B8;border-radius:14px;overflow:hidden;">

                  <tr>
                    <td style="background-color:#1F3A2E;padding:24px 32px;">
                      <h1 style="margin:0;color:#FFFFFF;font-size:28px;">CampConnect</h1>
                      <p style="margin:8px 0 0 0;color:#DDE7DF;font-size:14px;">Delivery reward notification</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:32px;">
                      <h2 style="margin:0 0 12px 0;font-size:24px;color:#244735;">You received a new tip 🎉</h2>

                      <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#6B6B6B;">
                        Hello %s, great news! A client rewarded your delivery service.
                      </p>

                      <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#E3DCD2;border-radius:12px;padding:20px;">
                        <tr>
                          <td>
                            <p style="margin:0 0 10px 0;font-size:13px;color:#6B6B6B;text-transform:uppercase;letter-spacing:0.5px;">Tip details</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Delivery ID:</strong> #%d</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Tip amount:</strong> %.2f DT</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Rating:</strong> %d / 5 ⭐</p>
                            <p style="margin:0;font-size:16px;"><strong>Client comment:</strong> %s</p>
                          </td>
                        </tr>
                      </table>

                      <div style="margin-top:24px;padding:16px 18px;background-color:#F1F7EA;border-left:4px solid #6A8F3B;border-radius:8px;">
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#1C1C1C;">
                          Your wallet balance has been updated automatically.
                        </p>
                      </div>

                      <p style="margin:28px 0 0 0;font-size:15px;line-height:1.6;color:#6B6B6B;">
                        Thank you for delivering with <strong style="color:#244735;">CampConnect</strong>.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:20px 32px;background-color:#F3EEE6;border-top:1px solid #CFC6B8;">
                      <p style="margin:0;font-size:12px;color:#6B6B6B;">
                        This is an automated message from CampConnect.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.formatted(safeName, livraisonId, tipAmount, rating, safeComment);
    }
}