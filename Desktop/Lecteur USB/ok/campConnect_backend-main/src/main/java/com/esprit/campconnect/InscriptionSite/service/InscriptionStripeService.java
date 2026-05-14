package com.esprit.campconnect.InscriptionSite.service;

import com.esprit.campconnect.InscriptionSite.entity.InscriptionSite;
import com.esprit.campconnect.config.StripeProperties;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.Currency;
import java.util.Locale;

@RequiredArgsConstructor
@Service
public class InscriptionStripeService {

    private final StripeProperties stripeProperties;


    public Session createCheckoutSession(InscriptionSite inscriptionSite) {
        System.out.println("STRIPE KEY: " + stripeProperties.getSecretKey());
        System.out.println("Stripe secret configured? " + (stripeProperties.getSecretKey() != null && !stripeProperties.getSecretKey().isBlank()));
        System.out.println("Stripe frontend URL: " + stripeProperties.getFrontendBaseUrl());
        configureSecretKey();

        try {
            long numberOfNights = ChronoUnit.DAYS.between(
                    inscriptionSite.getDateDebut(),
                    inscriptionSite.getDateFin()
            );

            if (numberOfNights <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid booking duration");
            }

            BigDecimal totalAmount = BigDecimal.valueOf(inscriptionSite.getSiteCamping()
                    .getPrixParNuit()).multiply(BigDecimal.
                    valueOf(numberOfNights)).multiply(BigDecimal.valueOf(inscriptionSite.getNumberOfGuests()));

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setClientReferenceId(String.valueOf(inscriptionSite.getIdInscription()))
                    .setCustomerEmail(inscriptionSite.getUtilisateur().getEmail())
                    .setSuccessUrl(buildSuccessUrl(inscriptionSite.getIdInscription()))
                    .setCancelUrl(buildCancelUrl(inscriptionSite.getIdInscription()))
                    .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                    .putMetadata("inscriptionId", String.valueOf(inscriptionSite.getIdInscription()))
                    .putMetadata("siteId", String.valueOf(inscriptionSite.getSiteCamping().getIdSite()))
                    .putMetadata("userId", String.valueOf(inscriptionSite.getUtilisateur().getId()))
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(getCurrencyCode())
                                                    .setUnitAmount(toMinorAmount(totalAmount))
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Camping booking: " + inscriptionSite.getSiteCamping().getNom())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            return Session.create(params);

        } catch (StripeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Stripe could not create the checkout session: " + exception.getMessage(),
                    exception
            );
        }
    }

    private void configureSecretKey() {
        if (!StringUtils.hasText(stripeProperties.getSecretKey())) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe secret key is not configured"
            );
        }

        Stripe.apiKey = stripeProperties.getSecretKey();
    }

    private String getCurrencyCode() {
        return stripeProperties.getCurrency().toLowerCase(Locale.ROOT);
    }

    private Long toMinorAmount(BigDecimal amount) {
        try {
            Currency currency = Currency.getInstance(getCurrencyCode().toUpperCase(Locale.ROOT));
            int fractionDigits = Math.max(currency.getDefaultFractionDigits(), 0);

            return amount
                    .movePointRight(fractionDigits)
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValueExact();
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported Stripe currency configuration",
                    exception
            );
        }
    }

    private String buildSuccessUrl(Long inscriptionId) {
        return stripeProperties.getFrontendBaseUrl()
                + "/booking-payment-success?payment=success&inscriptionId="
                + inscriptionId
                + "&session_id={CHECKOUT_SESSION_ID}";
    }

    private String buildCancelUrl(Long inscriptionId) {
        return stripeProperties.getFrontendBaseUrl()
                + "/booking-payment-cancel?payment=cancel&inscriptionId="
                + inscriptionId;
    }
}
