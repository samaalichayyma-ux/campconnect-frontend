package com.esprit.campconnect.Mail.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailServiceImp implements IMailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendMail(String to, String subject, String body) {
        System.out.println("📧 Début envoi mail");
        System.out.println("📧 From: " + fromEmail);
        System.out.println("📧 To: " + to);
        System.out.println("📧 Subject: " + subject);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            System.out.println("✅ Mail envoyé avec succès");
        } catch (Exception e) {
            System.out.println("❌ Erreur envoi mail: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}