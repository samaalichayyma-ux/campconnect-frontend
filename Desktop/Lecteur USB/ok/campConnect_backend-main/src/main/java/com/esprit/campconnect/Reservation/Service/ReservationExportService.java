package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Event.Entity.Event;
import com.esprit.campconnect.Event.Repository.EventRepository;
import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.Reservation.Enum.PaymentStatus;
import com.esprit.campconnect.Reservation.Enum.ReservationExportFormat;
import com.esprit.campconnect.Reservation.Enum.ReservationStatus;
import com.esprit.campconnect.Reservation.Repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationExportService {

    private static final float PAGE_MARGIN = 42F;
    private static final float BODY_FONT_SIZE = 10F;
    private static final float LINE_HEIGHT = 14F;
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm", Locale.ENGLISH);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);

    private final ReservationRepository reservationRepository;
    private final EventRepository eventRepository;

    public ExportArtifact generateGuestList(Long eventId, ReservationExportFormat format) {
        Event event = getEventOrThrow(eventId);
        List<Reservation> reservations = reservationRepository.findByEventIdWithDetails(eventId).stream()
                .filter(this::includeInGuestList)
                .sorted(Comparator.comparing(this::safeUserName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        String fileBase = "guest-list-" + sanitizeFilename(event.getTitre());
        return format == ReservationExportFormat.PDF
                ? new ExportArtifact(generateEventRosterPdf("Guest List", event, reservations, false), "application/pdf", fileBase + ".pdf")
                : new ExportArtifact(generateGuestListCsv(event, reservations), "text/csv", fileBase + ".csv");
    }

    public ExportArtifact generateAttendanceSheet(Long eventId, ReservationExportFormat format) {
        Event event = getEventOrThrow(eventId);
        List<Reservation> reservations = reservationRepository.findByEventIdWithDetails(eventId).stream()
                .filter(this::includeInAttendanceSheet)
                .sorted(Comparator.comparing(this::safeUserName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        String fileBase = "attendance-sheet-" + sanitizeFilename(event.getTitre());
        return format == ReservationExportFormat.PDF
                ? new ExportArtifact(generateEventRosterPdf("Attendance Sheet", event, reservations, true), "application/pdf", fileBase + ".pdf")
                : new ExportArtifact(generateAttendanceCsv(event, reservations), "text/csv", fileBase + ".csv");
    }

    public ExportArtifact generateReservationReport(ReservationExportFormat format) {
        List<Reservation> reservations = reservationRepository.findAllWithDetails().stream()
                .sorted(Comparator.comparing(Reservation::getDateCreation, Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
                .toList();

        return format == ReservationExportFormat.PDF
                ? new ExportArtifact(generateReservationReportPdf(reservations), "application/pdf", "reservation-report.pdf")
                : new ExportArtifact(generateReservationReportCsv(reservations), "text/csv", "reservation-report.csv");
    }

    public ExportArtifact generateRevenueReport(ReservationExportFormat format) {
        List<Reservation> reservations = reservationRepository.findAllWithDetails();
        List<RevenueRow> rows = buildRevenueRows(reservations);

        return format == ReservationExportFormat.PDF
                ? new ExportArtifact(generateRevenueReportPdf(rows), "application/pdf", "revenue-report.pdf")
                : new ExportArtifact(generateRevenueReportCsv(rows), "text/csv", "revenue-report.csv");
    }

    public ReservationExportFormat parseFormat(String rawFormat) {
        if (rawFormat == null || rawFormat.isBlank()) {
            return ReservationExportFormat.CSV;
        }

        try {
            return ReservationExportFormat.valueOf(rawFormat.trim().toUpperCase(Locale.ENGLISH));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported export format: " + rawFormat);
        }
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found with id: " + eventId));
    }

    private boolean includeInGuestList(Reservation reservation) {
        if (reservation == null || Boolean.TRUE.equals(reservation.getEstEnAttente())) {
            return false;
        }

        return reservation.getStatut() == ReservationStatus.CONFIRMED
                || reservation.getStatut() == ReservationStatus.PAID
                || reservation.getStatut() == ReservationStatus.ATTENDED
                || reservation.getStatut() == ReservationStatus.NO_SHOW;
    }

    private boolean includeInAttendanceSheet(Reservation reservation) {
        return includeInGuestList(reservation);
    }

    private byte[] generateGuestListCsv(Event event, List<Reservation> reservations) {
        StringBuilder builder = new StringBuilder();
        builder.append("Event,Starts At,Location,Reservation ID,Guest Name,Email,Participants,Status,Payment,Total\n");
        for (Reservation reservation : reservations) {
            appendCsvRow(builder,
                    safeEventTitle(event),
                    formatDateTime(event.getDateDebut()),
                    safeValue(event.getLieu()),
                    "#" + reservation.getId(),
                    safeUserName(reservation),
                    safeUserEmail(reservation),
                    String.valueOf(reservation.getNombreParticipants()),
                    formatEnumLabel(reservation.getStatut() != null ? reservation.getStatut().name() : null),
                    formatEnumLabel(reservation.getStatutPaiement() != null ? reservation.getStatutPaiement().name() : null),
                    formatMoney(reservation.getPrixTotal()));
        }
        return builder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private byte[] generateAttendanceCsv(Event event, List<Reservation> reservations) {
        StringBuilder builder = new StringBuilder();
        builder.append("Event,Date,Reservation ID,Guest Name,Email,Participants,Current Status,Attendance Result,Check-in Notes\n");
        for (Reservation reservation : reservations) {
            appendCsvRow(builder,
                    safeEventTitle(event),
                    formatDate(event.getDateDebut()),
                    "#" + reservation.getId(),
                    safeUserName(reservation),
                    safeUserEmail(reservation),
                    String.valueOf(reservation.getNombreParticipants()),
                    formatEnumLabel(reservation.getStatut() != null ? reservation.getStatut().name() : null),
                    formatAttendanceResult(reservation),
                    "");
        }
        return builder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private byte[] generateReservationReportCsv(List<Reservation> reservations) {
        StringBuilder builder = new StringBuilder();
        builder.append("Reservation ID,Event,Guest,Email,Created At,Status,Payment,Participants,Gross,Refunded,Net Paid,Feedback Rating\n");
        for (Reservation reservation : reservations) {
            appendCsvRow(builder,
                    "#" + reservation.getId(),
                    reservation.getEvent() != null ? safeValue(reservation.getEvent().getTitre()) : "-",
                    safeUserName(reservation),
                    safeUserEmail(reservation),
                    formatDateTime(reservation.getDateCreation()),
                    formatEnumLabel(reservation.getStatut() != null ? reservation.getStatut().name() : null),
                    formatEnumLabel(reservation.getStatutPaiement() != null ? reservation.getStatutPaiement().name() : null),
                    String.valueOf(reservation.getNombreParticipants()),
                    formatMoney(reservation.getPrixTotal()),
                    formatMoney(resolveRefundAmount(reservation)),
                    formatMoney(calculateNetPaid(reservation)),
                    reservation.getFeedbackRating() != null ? String.valueOf(reservation.getFeedbackRating()) : "-");
        }
        return builder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private byte[] generateRevenueReportCsv(List<RevenueRow> rows) {
        StringBuilder builder = new StringBuilder();
        builder.append("Event,Starts At,Reservations,Guests,Gross Revenue,Refunded,Net Revenue,Paid Reservations,Average Rating,Feedback Responses\n");
        for (RevenueRow row : rows) {
            appendCsvRow(builder,
                    row.title(),
                    row.startsAt(),
                    String.valueOf(row.reservations()),
                    String.valueOf(row.guests()),
                    formatMoney(row.grossRevenue()),
                    formatMoney(row.refundedRevenue()),
                    formatMoney(row.netRevenue()),
                    String.valueOf(row.paidReservations()),
                    row.averageRating() > 0 ? String.format(Locale.ENGLISH, "%.1f", row.averageRating()) : "-",
                    String.valueOf(row.feedbackResponses()));
        }
        return builder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private byte[] generateEventRosterPdf(String title, Event event, List<Reservation> reservations, boolean attendanceMode) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float y = page.getMediaBox().getHeight() - 48F;
                y = writeTitle(contentStream, y, title);
                y = writeMutedLine(contentStream, y, safeEventTitle(event));
                y = writeMutedLine(contentStream, y, formatDateTime(event.getDateDebut()) + " | " + safeValue(event.getLieu()));
                y -= 8F;

                List<String> headers = attendanceMode
                        ? List.of("Guest", "Email", "Guests", "Status", "Attendance")
                        : List.of("Guest", "Email", "Guests", "Status", "Payment");

                y = writeTableHeader(contentStream, y, headers);
                for (Reservation reservation : reservations) {
                    List<String> columns = attendanceMode
                            ? List.of(
                            safeUserName(reservation),
                            safeUserEmail(reservation),
                            String.valueOf(reservation.getNombreParticipants()),
                            formatEnumLabel(reservation.getStatut() != null ? reservation.getStatut().name() : null),
                            formatAttendanceResult(reservation))
                            : List.of(
                            safeUserName(reservation),
                            safeUserEmail(reservation),
                            String.valueOf(reservation.getNombreParticipants()),
                            formatEnumLabel(reservation.getStatut() != null ? reservation.getStatut().name() : null),
                            formatEnumLabel(reservation.getStatutPaiement() != null ? reservation.getStatutPaiement().name() : null));
                    y = writeTableRow(contentStream, y, columns);
                }
            }

            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate the export PDF", exception);
        }
    }

    private byte[] generateReservationReportPdf(List<Reservation> reservations) {
        List<String> lines = new ArrayList<>();
        lines.add("Reservation Report");
        lines.add("Generated on " + formatDateTime(LocalDateTime.now()));
        lines.add("");

        for (Reservation reservation : reservations) {
            lines.add("Reservation #" + reservation.getId() + " | " + safeEventTitle(reservation.getEvent()));
            lines.add("Guest: " + safeUserName(reservation) + " | " + safeUserEmail(reservation));
            lines.add("Status: " + formatEnumLabel(reservation.getStatut() != null ? reservation.getStatut().name() : null)
                    + " | Payment: " + formatEnumLabel(reservation.getStatutPaiement() != null ? reservation.getStatutPaiement().name() : null));
            lines.add("Participants: " + reservation.getNombreParticipants()
                    + " | Gross: " + formatMoney(reservation.getPrixTotal())
                    + " | Refunded: " + formatMoney(resolveRefundAmount(reservation))
                    + " | Net: " + formatMoney(calculateNetPaid(reservation)));
            if (reservation.getFeedbackRating() != null) {
                lines.add("Feedback: " + reservation.getFeedbackRating() + "/5"
                        + (reservation.getFeedbackComment() != null && !reservation.getFeedbackComment().isBlank()
                        ? " | " + reservation.getFeedbackComment().trim()
                        : ""));
            }
            lines.add("");
        }

        return generateTextPdf(lines);
    }

    private byte[] generateRevenueReportPdf(List<RevenueRow> rows) {
        List<String> lines = new ArrayList<>();
        lines.add("Revenue Report");
        lines.add("Generated on " + formatDateTime(LocalDateTime.now()));
        lines.add("");

        for (RevenueRow row : rows) {
            lines.add(row.title() + " | " + row.startsAt());
            lines.add("Reservations: " + row.reservations()
                    + " | Guests: " + row.guests()
                    + " | Paid: " + row.paidReservations());
            lines.add("Gross: " + formatMoney(row.grossRevenue())
                    + " | Refunded: " + formatMoney(row.refundedRevenue())
                    + " | Net: " + formatMoney(row.netRevenue()));
            if (row.feedbackResponses() > 0) {
                lines.add("Feedback: " + String.format(Locale.ENGLISH, "%.1f/5", row.averageRating())
                        + " across " + row.feedbackResponses() + " responses");
            }
            lines.add("");
        }

        return generateTextPdf(lines);
    }

    private byte[] generateTextPdf(List<String> lines) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float y = page.getMediaBox().getHeight() - 48F;
                for (String line : lines) {
                    contentStream.beginText();
                    contentStream.setFont(PDType1Font.HELVETICA, BODY_FONT_SIZE);
                    contentStream.newLineAtOffset(PAGE_MARGIN, y);
                    contentStream.showText(sanitizePdf(line));
                    contentStream.endText();
                    y -= LINE_HEIGHT;
                }
            }

            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate the export PDF", exception);
        }
    }

    private List<RevenueRow> buildRevenueRows(List<Reservation> reservations) {
        Map<Long, List<Reservation>> reservationsByEventId = reservations.stream()
                .filter(reservation -> reservation.getEvent() != null && reservation.getEvent().getId() != null)
                .collect(Collectors.groupingBy(reservation -> reservation.getEvent().getId(), LinkedHashMap::new, Collectors.toList()));

        return reservationsByEventId.values().stream()
                .map(eventReservations -> {
                    Event event = eventReservations.get(0).getEvent();
                    BigDecimal grossRevenue = eventReservations.stream()
                            .filter(reservation -> reservation.getStatutPaiement() == PaymentStatus.PAID
                                    || reservation.getStatutPaiement() == PaymentStatus.PARTIALLY_REFUNDED
                                    || reservation.getStatutPaiement() == PaymentStatus.REFUNDED)
                            .map(reservation -> reservation.getPrixTotal() != null ? reservation.getPrixTotal() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal refundedRevenue = eventReservations.stream()
                            .map(this::resolveRefundAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal netRevenue = eventReservations.stream()
                            .map(this::calculateNetPaid)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    List<Reservation> ratedReservations = eventReservations.stream()
                            .filter(reservation -> reservation.getFeedbackRating() != null)
                            .toList();
                    double averageRating = ratedReservations.isEmpty()
                            ? 0D
                            : ratedReservations.stream().mapToInt(Reservation::getFeedbackRating).average().orElse(0D);

                    return new RevenueRow(
                            safeEventTitle(event),
                            formatDateTime(event != null ? event.getDateDebut() : null),
                            eventReservations.size(),
                            eventReservations.stream().mapToInt(reservation -> Objects.requireNonNullElse(reservation.getNombreParticipants(), 0)).sum(),
                            grossRevenue,
                            refundedRevenue,
                            netRevenue,
                            (int) eventReservations.stream().filter(reservation -> reservation.getStatutPaiement() == PaymentStatus.PAID).count(),
                            averageRating,
                            ratedReservations.size()
                    );
                })
                .sorted(Comparator.comparing(RevenueRow::netRevenue).reversed())
                .toList();
    }

    private float writeTitle(PDPageContentStream contentStream, float y, String value) throws IOException {
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA_BOLD, 18F);
        contentStream.newLineAtOffset(PAGE_MARGIN, y);
        contentStream.showText(sanitizePdf(value));
        contentStream.endText();
        return y - 22F;
    }

    private float writeMutedLine(PDPageContentStream contentStream, float y, String value) throws IOException {
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 10F);
        contentStream.newLineAtOffset(PAGE_MARGIN, y);
        contentStream.showText(sanitizePdf(value));
        contentStream.endText();
        return y - 14F;
    }

    private float writeTableHeader(PDPageContentStream contentStream, float y, List<String> headers) throws IOException {
        return writeTableRow(contentStream, y, headers, true);
    }

    private float writeTableRow(PDPageContentStream contentStream, float y, List<String> columns) throws IOException {
        return writeTableRow(contentStream, y, columns, false);
    }

    private float writeTableRow(PDPageContentStream contentStream, float y, List<String> columns, boolean header) throws IOException {
        float[] columnWidths = new float[]{120F, 155F, 50F, 85F, 90F};
        float x = PAGE_MARGIN;

        for (int index = 0; index < Math.min(columns.size(), columnWidths.length); index++) {
            contentStream.beginText();
            contentStream.setFont(header ? PDType1Font.HELVETICA_BOLD : PDType1Font.HELVETICA, BODY_FONT_SIZE);
            contentStream.newLineAtOffset(x, y);
            contentStream.showText(truncateForPdf(columns.get(index), columnWidths[index]));
            contentStream.endText();
            x += columnWidths[index];
        }

        return y - LINE_HEIGHT;
    }

    private String truncateForPdf(String value, float maxWidth) throws IOException {
        String sanitized = sanitizePdf(value);
        if (PDType1Font.HELVETICA.getStringWidth(sanitized) / 1000F * BODY_FONT_SIZE <= maxWidth) {
            return sanitized;
        }

        String ellipsis = "...";
        String candidate = sanitized;
        while (!candidate.isEmpty()
                && PDType1Font.HELVETICA.getStringWidth(candidate + ellipsis) / 1000F * BODY_FONT_SIZE > maxWidth) {
            candidate = candidate.substring(0, candidate.length() - 1);
        }
        return candidate + ellipsis;
    }

    private void appendCsvRow(StringBuilder builder, String... values) {
        builder.append(java.util.Arrays.stream(values)
                .map(this::escapeCsv)
                .collect(Collectors.joining(",")));
        builder.append('\n');
    }

    private String escapeCsv(String value) {
        String safe = value == null ? "" : value;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }

    private String sanitizeFilename(String value) {
        String safe = value == null || value.isBlank() ? "export" : value.trim().toLowerCase(Locale.ENGLISH);
        return safe.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private String sanitizePdf(String value) {
        String safe = value == null ? "-" : value;
        return safe.replace("\n", " ").replace("\r", " ");
    }

    private String safeEventTitle(Event event) {
        return event != null ? safeValue(event.getTitre()) : "-";
    }

    private String safeUserName(Reservation reservation) {
        return reservation != null && reservation.getUtilisateur() != null
                ? safeValue(reservation.getUtilisateur().getNom())
                : "-";
    }

    private String safeUserEmail(Reservation reservation) {
        return reservation != null && reservation.getUtilisateur() != null
                ? safeValue(reservation.getUtilisateur().getEmail())
                : "-";
    }

    private String safeValue(String value) {
        return value == null || value.isBlank() ? "-" : value.trim();
    }

    private String formatAttendanceResult(Reservation reservation) {
        if (reservation == null || reservation.getStatut() == null) {
            return "Pending";
        }

        return switch (reservation.getStatut()) {
            case ATTENDED -> "Attended";
            case NO_SHOW -> "No-show";
            default -> "Pending";
        };
    }

    private String formatEnumLabel(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return "-";
        }

        return java.util.Arrays.stream(rawValue.toLowerCase(Locale.ENGLISH).split("_"))
                .map(segment -> segment.isEmpty() ? segment : Character.toUpperCase(segment.charAt(0)) + segment.substring(1))
                .collect(Collectors.joining(" "));
    }

    private String formatDateTime(LocalDateTime value) {
        return value != null ? DATE_TIME_FORMATTER.format(value) : "-";
    }

    private String formatDate(LocalDateTime value) {
        return value != null ? DATE_FORMATTER.format(value) : "-";
    }

    private String formatMoney(BigDecimal amount) {
        BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;
        return "$" + safeAmount.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveRefundAmount(Reservation reservation) {
        if (reservation == null) {
            return BigDecimal.ZERO;
        }

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

    private BigDecimal calculateNetPaid(Reservation reservation) {
        if (reservation == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal chargedAmount = reservation.getPrixTotal() != null ? reservation.getPrixTotal() : BigDecimal.ZERO;
        return chargedAmount.subtract(resolveRefundAmount(reservation)).max(BigDecimal.ZERO);
    }

    public record ExportArtifact(byte[] content, String contentType, String fileName) {
    }

    private record RevenueRow(
            String title,
            String startsAt,
            int reservations,
            int guests,
            BigDecimal grossRevenue,
            BigDecimal refundedRevenue,
            BigDecimal netRevenue,
            int paidReservations,
            double averageRating,
            int feedbackResponses
    ) {
    }
}
