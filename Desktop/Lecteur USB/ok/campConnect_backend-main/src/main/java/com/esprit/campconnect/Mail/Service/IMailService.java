package com.esprit.campconnect.Mail.Service;

public interface IMailService {
    void sendMail(String to, String subject, String body);
}