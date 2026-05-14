package com.esprit.campconnect.common;


import com.esprit.campconnect.InscriptionSite.entity.InscriptionSite;
import org.springframework.stereotype.Service;

@Service

public class BookingEmailTemplateService {
    public String buildCustomerBookingConfirmedEmail(InscriptionSite inscription) {
        String customerEmail = inscription.getUtilisateur().getEmail();
        String siteName = inscription.getSiteCamping().getNom();
        String location = inscription.getSiteCamping().getLocalisation();
        String startDate = inscription.getDateDebut().toString();
        String endDate = inscription.getDateFin().toString();
        String guests = String.valueOf(inscription.getNumberOfGuests());
        String bookingId = String.valueOf(inscription.getIdInscription());

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
                      <p style="margin:8px 0 0 0;color:#DDE7DF;font-size:14px;">Your camping adventure starts here</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:32px;">
                      <h2 style="margin:0 0 12px 0;font-size:24px;color:#244735;">Booking confirmed</h2>
                      <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#6B6B6B;">
                        Hello,
                        your payment has been successfully confirmed. Your booking ticket is attached to this email.
                      </p>

                      <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#E3DCD2;border-radius:12px;padding:20px;">
                        <tr>
                          <td>
                            <p style="margin:0 0 10px 0;font-size:13px;color:#6B6B6B;text-transform:uppercase;letter-spacing:0.5px;">Booking details</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Site:</strong> %s</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Location:</strong> %s</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Dates:</strong> %s → %s</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Guests:</strong> %s</p>
                            <p style="margin:0;font-size:16px;"><strong>Booking ID:</strong> #%s</p>
                          </td>
                        </tr>
                      </table>

                      <div style="margin-top:24px;padding:16px 18px;background-color:#F1F7EA;border-left:4px solid #6A8F3B;border-radius:8px;">
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#1C1C1C;">
                          Please keep your attached PDF ticket and present it when needed.
                        </p>
                      </div>

                      <p style="margin:28px 0 0 0;font-size:15px;line-height:1.6;color:#6B6B6B;">
                        Thank you for choosing <strong style="color:#244735;">CampConnect</strong>.
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
        """.formatted(siteName, location, startDate, endDate, guests, bookingId);
    }

    public String buildOwnerBookingAlertEmail(InscriptionSite inscription) {
        String camperEmail = inscription.getUtilisateur().getEmail();
        String siteName = inscription.getSiteCamping().getNom();
        String location = inscription.getSiteCamping().getLocalisation();
        String startDate = inscription.getDateDebut().toString();
        String endDate = inscription.getDateFin().toString();
        String guests = String.valueOf(inscription.getNumberOfGuests());
        String bookingId = String.valueOf(inscription.getIdInscription());

        return """
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#EDE7DE;font-family:Arial,sans-serif;color:#1C1C1C;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#EDE7DE;padding:24px 0;">
            <tr>
              <td align="center">
                <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#F7F3ED;border:1px solid #CFC6B8;border-radius:14px;overflow:hidden;">
                  
                  <tr>
                    <td style="background-color:#244735;padding:24px 32px;">
                      <h1 style="margin:0;color:#FFFFFF;font-size:28px;">CampConnect</h1>
                      <p style="margin:8px 0 0 0;color:#DDE7DF;font-size:14px;">Host booking notification</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:32px;">
                      <h2 style="margin:0 0 12px 0;font-size:24px;color:#244735;">New booking confirmed</h2>
                      <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#6B6B6B;">
                        A new reservation has just been confirmed for your camping site.
                      </p>

                      <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#E3DCD2;border-radius:12px;padding:20px;">
                        <tr>
                          <td>
                            <p style="margin:0 0 10px 0;font-size:13px;color:#6B6B6B;text-transform:uppercase;letter-spacing:0.5px;">Reservation summary</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Site:</strong> %s</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Location:</strong> %s</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Camper:</strong> %s</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Dates:</strong> %s → %s</p>
                            <p style="margin:0 0 8px 0;font-size:16px;"><strong>Guests:</strong> %s</p>
                            <p style="margin:0;font-size:16px;"><strong>Booking ID:</strong> #%s</p>
                          </td>
                        </tr>
                      </table>

                      <div style="margin-top:24px;padding:16px 18px;background-color:#F1F7EA;border-left:4px solid #6A8F3B;border-radius:8px;">
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#1C1C1C;">
                          You may review this booking from your CampConnect dashboard.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:20px 32px;background-color:#F3EEE6;border-top:1px solid #CFC6B8;">
                      <p style="margin:0;font-size:12px;color:#6B6B6B;">
                        Automated notification sent by CampConnect.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """.formatted(siteName, location, camperEmail, startDate, endDate, guests, bookingId);
    }
}
