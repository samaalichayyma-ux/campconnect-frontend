package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.PaymentStatus;
import com.esprit.campconnect.config.GoogleMapsService;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@RequiredArgsConstructor
@Service
public class ReservationReceiptPdfService {

    private final GoogleMapsService googleMapsService;
    private static final float PAGE_MARGIN = 52F;
    private static final float BODY_FONT_SIZE = 11F;
    private static final float LINE_HEIGHT = 16F;
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy 'at' HH:mm", Locale.ENGLISH);

    public byte[] generateReceipt(Reservation reservation) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float y = page.getMediaBox().getHeight() - 60F;

                y = writeTitle(contentStream, PAGE_MARGIN, y, "CampConnect Payment Receipt");
                y = writeMutedText(contentStream, PAGE_MARGIN, y,
                        "Receipt reference " + buildReceiptReference(reservation));
                y -= 10F;

                y = writeSectionTitle(contentStream, PAGE_MARGIN, y, "Reservation");
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Reservation ID", "#" + reservation.getId());
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Event", safeValue(reservation.getEvent() != null ? reservation.getEvent().getTitre() : null));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Location", safeValue(reservation.getEvent() != null ? reservation.getEvent().getLieu() : null));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Start", formatDateTime(reservation.getEvent() != null ? reservation.getEvent().getDateDebut() : null));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Participants", String.valueOf(reservation.getNombreParticipants()));
                y -= 4F;

                y = writeSectionTitle(contentStream, PAGE_MARGIN, y, "Customer");
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Name", safeValue(reservation.getUtilisateur() != null ? reservation.getUtilisateur().getNom() : null));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Email", safeValue(reservation.getUtilisateur() != null ? reservation.getUtilisateur().getEmail() : null));
                y -= 4F;

                y = writeSectionTitle(contentStream, PAGE_MARGIN, y, "Payment Summary");
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Payment status", reservation.getStatutPaiement().name().replace('_', ' '));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Reservation status", reservation.getStatut().name().replace('_', ' '));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Amount charged", formatCurrency(reservation.getPrixTotal()));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Refund amount", formatCurrency(resolveRefundAmount(reservation)));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Net paid", formatCurrency(calculateNetPaid(reservation)));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Paid on", formatDateTime(reservation.getDatePaiement()));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Refunded on", formatDateTime(reservation.getRefundedAt()));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Transaction", safeValue(reservation.getTransactionId()));
                y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Stripe invoice", safeValue(reservation.getStripeInvoiceNumber()));

                if (StringUtils.hasText(reservation.getCancellationReason())) {
                    y -= 4F;
                    y = writeSectionTitle(contentStream, PAGE_MARGIN, y, "Cancellation Note");
                    y = writeParagraph(contentStream, PAGE_MARGIN, y, reservation.getCancellationReason());
                }

                y -= 6F;
                writeFooter(contentStream, PAGE_MARGIN, y,
                        "This receipt was generated by CampConnect. Use My Reservations to reopen the Stripe bill or download updated PDFs.");
            }

            appendEventLocationPage(document, reservation);
            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "CampConnect could not generate the reservation receipt PDF",
                    exception
            );
        }
    }

    private float writeTitle(PDPageContentStream contentStream, float x, float y, String value) throws IOException {
        return writeText(contentStream, PDType1Font.HELVETICA_BOLD, 20F, x, y, value, 24F);
    }

    private float writeSectionTitle(PDPageContentStream contentStream, float x, float y, String value) throws IOException {
        return writeText(contentStream, PDType1Font.HELVETICA_BOLD, 12F, x, y, value.toUpperCase(Locale.ENGLISH), 18F);
    }

    private float writeMutedText(PDPageContentStream contentStream, float x, float y, String value) throws IOException {
        return writeText(contentStream, PDType1Font.HELVETICA, 10F, x, y, value, 14F);
    }

    private float writeLabelValue(PDPageContentStream contentStream, float x, float y, String label, String value) throws IOException {
        float labelWidth = 112F;

        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, BODY_FONT_SIZE);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(label + ":");
        contentStream.endText();

        List<String> wrappedLines = wrapText(value, PDType1Font.HELVETICA, BODY_FONT_SIZE, 370F);
        float currentY = y;
        for (int index = 0; index < wrappedLines.size(); index++) {
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, BODY_FONT_SIZE);
            contentStream.newLineAtOffset(x + labelWidth, currentY);
            contentStream.showText(wrappedLines.get(index));
            contentStream.endText();
            currentY -= LINE_HEIGHT;
        }

        return currentY;
    }

    private float writeParagraph(PDPageContentStream contentStream, float x, float y, String value) throws IOException {
        List<String> wrappedLines = wrapText(value, PDType1Font.HELVETICA, BODY_FONT_SIZE, 470F);
        float currentY = y;
        for (String line : wrappedLines) {
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, BODY_FONT_SIZE);
            contentStream.newLineAtOffset(x, currentY);
            contentStream.showText(line);
            contentStream.endText();
            currentY -= LINE_HEIGHT;
        }

        return currentY;
    }

    private void writeFooter(PDPageContentStream contentStream, float x, float y, String value) throws IOException {
        List<String> wrappedLines = wrapText(value, PDType1Font.HELVETICA_OBLIQUE, 9.5F, 480F);
        float currentY = y;
        for (String line : wrappedLines) {
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA_OBLIQUE, 9.5F);
            contentStream.newLineAtOffset(x, currentY);
            contentStream.showText(line);
            contentStream.endText();
            currentY -= 13F;
        }
    }

    private float writeText(
            PDPageContentStream contentStream,
            PDType1Font font,
            float fontSize,
            float x,
            float y,
            String value,
            float nextLineOffset
    ) throws IOException {
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(value);
        contentStream.endText();
        return y - nextLineOffset;
    }

    private void appendEventLocationPage(PDDocument document, Reservation reservation) throws IOException {
        Event event = reservation != null ? reservation.getEvent() : null;
        if (event == null) {
            return;
        }

        String googleMapsUrl = googleMapsService.buildGoogleMapsUrl(event);
        byte[] staticMapImage = googleMapsService.fetchStaticMap(event).orElse(null);
        String locationLabel = safeValue(event.getLieu());
        String coordinatesLabel = formatCoordinates(event);

        if ("-".equals(locationLabel)
                && "-".equals(coordinatesLabel)
                && !StringUtils.hasText(googleMapsUrl)
                && staticMapImage == null) {
            return;
        }

        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);

        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            float y = page.getMediaBox().getHeight() - 60F;

            y = writeTitle(contentStream, PAGE_MARGIN, y, "Event Location");
            y = writeMutedText(contentStream, PAGE_MARGIN, y,
                    "Saved camping directions for " + safeValue(event.getTitre()));
            y -= 10F;

            y = writeSectionTitle(contentStream, PAGE_MARGIN, y, "Location Summary");
            y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Event", safeValue(event.getTitre()));
            y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Camping location", locationLabel);
            y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Coordinates", coordinatesLabel);
            y = writeLabelValue(contentStream, PAGE_MARGIN, y, "Google Maps", safeValue(googleMapsUrl));

            if (staticMapImage != null) {
                y -= 6F;
                y = writeSectionTitle(contentStream, PAGE_MARGIN, y, "Map Preview");
                y = drawMapPreview(
                        document,
                        contentStream,
                        staticMapImage,
                        PAGE_MARGIN,
                        y,
                        page.getMediaBox().getWidth() - (PAGE_MARGIN * 2)
                );
            }

            writeFooter(contentStream, PAGE_MARGIN, y - 4F,
                    staticMapImage != null
                            ? "Map preview generated from Google Maps based on the saved campsite location."
                            : "Google Static Maps is not configured, so this page includes the saved Google Maps link instead.");
        }
    }

    private float drawMapPreview(
            PDDocument document,
            PDPageContentStream contentStream,
            byte[] imageBytes,
            float x,
            float y,
            float maxWidth
    ) throws IOException {
        PDImageXObject image = PDImageXObject.createFromByteArray(document, imageBytes, "reservation-location-map");
        float originalWidth = Math.max(1F, image.getWidth());
        float originalHeight = Math.max(1F, image.getHeight());

        float renderedWidth = maxWidth;
        float renderedHeight = renderedWidth * (originalHeight / originalWidth);
        float maxHeight = 260F;

        if (renderedHeight > maxHeight) {
            float scale = maxHeight / renderedHeight;
            renderedWidth *= scale;
            renderedHeight *= scale;
        }

        contentStream.drawImage(image, x, y - renderedHeight, renderedWidth, renderedHeight);
        return y - renderedHeight - 12F;
    }

    private List<String> wrapText(String value, PDType1Font font, float fontSize, float maxWidth) throws IOException {
        String safeValue = safeValue(value);
        List<String> lines = new ArrayList<>();
        StringBuilder currentLine = new StringBuilder();

        for (String word : safeValue.split("\\s+")) {
            String testLine = currentLine.isEmpty() ? word : currentLine + " " + word;
            float textWidth = font.getStringWidth(testLine) / 1000F * fontSize;
            if (textWidth <= maxWidth || currentLine.isEmpty()) {
                currentLine.setLength(0);
                currentLine.append(testLine);
                continue;
            }

            lines.add(currentLine.toString());
            currentLine.setLength(0);
            currentLine.append(word);
        }

        if (!currentLine.isEmpty()) {
            lines.add(currentLine.toString());
        }

        return lines.isEmpty() ? List.of("-") : lines;
    }

    private String buildReceiptReference(Reservation reservation) {
        LocalDateTime referenceTime = reservation.getDatePaiement() != null
                ? reservation.getDatePaiement()
                : reservation.getDateCreation();

        String timestamp = referenceTime != null
                ? referenceTime.format(DateTimeFormatter.ofPattern("yyyyMMdd", Locale.ENGLISH))
                : "00000000";

        return "CCR-" + reservation.getId() + "-" + timestamp;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? DATE_TIME_FORMATTER.format(dateTime) : "-";
    }

    private String formatCurrency(BigDecimal amount) {
        BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;
        return "$" + safeAmount.setScale(2, RoundingMode.HALF_UP);
    }

    private String formatCoordinates(Event event) {
        if (event == null || event.getLatitude() == null || event.getLongitude() == null) {
            return "-";
        }

        return event.getLatitude().stripTrailingZeros().toPlainString()
                + ", "
                + event.getLongitude().stripTrailingZeros().toPlainString();
    }

    private BigDecimal calculateNetPaid(Reservation reservation) {
        BigDecimal chargedAmount = reservation.getPrixTotal() != null ? reservation.getPrixTotal() : BigDecimal.ZERO;
        BigDecimal refundedAmount = resolveRefundAmount(reservation);
        return chargedAmount.subtract(refundedAmount).max(BigDecimal.ZERO);
    }

    private BigDecimal resolveRefundAmount(Reservation reservation) {
        BigDecimal recordedRefund = reservation.getRefundAmount() != null ? reservation.getRefundAmount() : BigDecimal.ZERO;
        if (recordedRefund.compareTo(BigDecimal.ZERO) > 0) {
            return recordedRefund;
        }

        if (reservation.getStatutPaiement() == PaymentStatus.REFUNDED) {
            return reservation.getPrixTotal() != null ? reservation.getPrixTotal() : BigDecimal.ZERO;
        }

        if (reservation.getStatutPaiement() == PaymentStatus.PARTIALLY_REFUNDED && reservation.getPrixTotal() != null) {
            return reservation.getPrixTotal().multiply(new BigDecimal("0.50")).setScale(2, RoundingMode.HALF_UP);
        }

        return BigDecimal.ZERO;
    }

    private String safeValue(String value) {
        return StringUtils.hasText(value) ? value : "-";
    }
}
