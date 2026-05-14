package com.esprit.campconnect.InscriptionSite.service;

import com.esprit.campconnect.InscriptionSite.entity.InscriptionSite;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class TicketPdfService {

    public byte[] generateTicketPdf(InscriptionSite inscription) {
        try (PDDocument document = new PDDocument()) {

            PDPage page = new PDPage();
            document.addPage(page);

            PDPageContentStream content = new PDPageContentStream(document, page);

            float pageWidth = page.getMediaBox().getWidth();

            Color primary = new Color(0x1f5c36);
            Color textColor = new Color(0x172b44);
            Color cardBg = new Color(0xffffff);

            long numberOfNights = ChronoUnit.DAYS.between(
                    inscription.getDateDebut(),
                    inscription.getDateFin()
            );

            double prixParNuit = inscription.getSiteCamping().getPrixParNuit();
            int numberOfGuests = inscription.getNumberOfGuests();
            double totalPrice = prixParNuit * numberOfNights * numberOfGuests;

            content.setNonStrokingColor(cardBg);
            content.addRect(40, 100, pageWidth - 80, 600);
            content.fill();

            content.setNonStrokingColor(primary);
            content.addRect(40, 650, pageWidth - 80, 50);
            content.fill();

            content.beginText();
            content.setNonStrokingColor(Color.WHITE);
            content.setFont(PDType1Font.HELVETICA_BOLD, 18);
            content.newLineAtOffset(60, 665);
            content.showText("CampConnect Ticket");
            content.endText();

            content.beginText();
            content.setNonStrokingColor(textColor);
            content.setFont(PDType1Font.HELVETICA, 12);
            content.setLeading(18f);
            content.newLineAtOffset(60, 600);

            content.showText("Site: " + inscription.getSiteCamping().getNom());
            content.newLine();

            content.showText("Location: " + inscription.getSiteCamping().getLocalisation());
            content.newLine();

            content.showText("Dates: " + inscription.getDateDebut() + " to " + inscription.getDateFin());
            content.newLine();

            content.showText("Guests: " + inscription.getNumberOfGuests());
            content.newLine();

            content.showText("Price per night: " + prixParNuit + " TND");
            content.newLine();

            content.showText("Number of nights: " + numberOfNights);
            content.newLine();

            content.showText("Total price: " + String.format("%.2f", totalPrice) + " TND");
            content.newLine();
            content.newLine();

            content.showText("Booking ID: #" + inscription.getIdInscription());
            content.newLine();

            content.showText("Status: " + inscription.getStatut().name());
            content.newLine();

            content.endText();

            String qrData =
                    "CampConnect Ticket\n" +
                            "Booking ID: " + inscription.getIdInscription() + "\n" +
                            "Site: " + inscription.getSiteCamping().getNom() + "\n" +
                            "Dates: " + inscription.getDateDebut() + " to " + inscription.getDateFin() + "\n" +
                            "Guests: " + inscription.getNumberOfGuests() + "\n" +
                            "Price per night: " + prixParNuit + " TND\n" +
                            "Nights: " + numberOfNights + "\n" +
                            "Total price: " + String.format("%.2f", totalPrice) + " TND\n" +
                            "Status: " + inscription.getStatut().name();

            BufferedImage qrImage = generateQrCode(qrData);
            PDImageXObject pdImage = LosslessFactory.createFromImage(document, qrImage);
            content.drawImage(pdImage, 350, 450, 120, 120);

            content.beginText();
            content.setNonStrokingColor(textColor);
            content.setFont(PDType1Font.HELVETICA_OBLIQUE, 10);
            content.newLineAtOffset(60, 140);
            content.showText("Thank you for choosing CampConnect");
            content.endText();

            content.close();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Failed to generate ticket PDF", e);
        }
    }

    private BufferedImage generateQrCode(String text) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bitMatrix = writer.encode(text, BarcodeFormat.QR_CODE, 150, 150);

            BufferedImage image = new BufferedImage(150, 150, BufferedImage.TYPE_INT_RGB);

            for (int x = 0; x < 150; x++) {
                for (int y = 0; y < 150; y++) {
                    image.setRGB(x, y, bitMatrix.get(x, y) ? 0x000000 : 0xFFFFFF);
                }
            }

            return image;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }
}