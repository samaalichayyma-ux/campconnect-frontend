package com.esprit.campconnect.MarketPlace.Code.Service;


import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class SmsServiceImpl implements ISmsService {

    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.phone.number}")
    private String fromPhone;

    @PostConstruct
    public void init() {
        if (!hasTwilioConfig()) {
            return;
        }

        Twilio.init(accountSid, authToken);
    }

    @Override
    public boolean sendSms(String to, String body) {
        if (!hasTwilioConfig()) {
            System.out.println("[Checkout verification] Twilio non configure. SMS non envoye.");
            System.out.println("[Checkout verification] " + body);
            return false;
        }

        Message.creator(
                new com.twilio.type.PhoneNumber(to),
                new com.twilio.type.PhoneNumber(fromPhone),
                body
        ).create();

        return true;
    }

    private boolean hasTwilioConfig() {
        return StringUtils.hasText(accountSid)
                && StringUtils.hasText(authToken)
                && StringUtils.hasText(fromPhone);
    }
}
