package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Reservation.Entity.Reservation;
import com.esprit.campconnect.config.StripeProperties;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.checkout.SessionRetrieveParams;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class StripeGatewayService {

    private final StripeProperties stripeProperties;

    public Session createCheckoutSession(Reservation reservation) {
        configureSecretKey();

        try {
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setClientReferenceId(String.valueOf(reservation.getId()))
                    .setCustomerCreation(SessionCreateParams.CustomerCreation.ALWAYS)
                    .setCustomerEmail(reservation.getUtilisateur().getEmail())
                    .setSuccessUrl(buildSuccessUrl(reservation.getId()))
                    .setCancelUrl(buildCancelUrl(reservation.getId()))
                    .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                    .putMetadata("reservationId", String.valueOf(reservation.getId()))
                    .putMetadata("eventId", String.valueOf(reservation.getEvent().getId()))
                    .putMetadata("userId", String.valueOf(reservation.getUtilisateur().getId()))
                    .putMetadata("promoCode", StringUtils.hasText(reservation.getPromoCode()) ? reservation.getPromoCode() : "NONE")
                    .setInvoiceCreation(
                            SessionCreateParams.InvoiceCreation.builder()
                                    .setEnabled(true)
                                    .setInvoiceData(
                                            SessionCreateParams.InvoiceCreation.InvoiceData.builder()
                                                    .setDescription(buildInvoiceDescription(reservation))
                                                    .setFooter("Thank you for booking with CampConnect.")
                                                    .putMetadata("reservationId", String.valueOf(reservation.getId()))
                                                    .putMetadata("eventId", String.valueOf(reservation.getEvent().getId()))
                                                    .putMetadata("userId", String.valueOf(reservation.getUtilisateur().getId()))
                                                    .putMetadata("eventTitle", reservation.getEvent().getTitre())
                                                    .putMetadata("promoCode", StringUtils.hasText(reservation.getPromoCode()) ? reservation.getPromoCode() : "NONE")
                                                    .build()
                                    )
                                    .build()
                    )
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(getCurrencyCode())
                                                    .setUnitAmount(toMinorAmount(reservation.getPrixTotal()))
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Event reservation: " + reservation.getEvent().getTitre())
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

    public Session retrieveCheckoutSession(String sessionId) {
        configureSecretKey();

        try {
            SessionRetrieveParams params = SessionRetrieveParams.builder()
                    .addExpand("invoice")
                    .build();
            return Session.retrieve(sessionId, params, null);
        } catch (StripeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Stripe could not retrieve the checkout session: " + exception.getMessage(),
                    exception
            );
        }
    }

    public Invoice retrieveInvoice(String invoiceId) {
        configureSecretKey();

        try {
            return Invoice.retrieve(invoiceId);
        } catch (StripeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Stripe could not retrieve the invoice: " + exception.getMessage(),
                    exception
            );
        }
    }

    public Refund createRefund(String paymentIntentId) {
        return createRefund(paymentIntentId, null);
    }

    public Refund createRefund(String paymentIntentId, BigDecimal amount) {
        configureSecretKey();

        try {
            RefundCreateParams.Builder paramsBuilder = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentId);

            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                paramsBuilder.setAmount(toMinorAmount(amount));
            }

            RefundCreateParams params = paramsBuilder.build();
            return Refund.create(params);
        } catch (StripeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Stripe could not process the refund: " + exception.getMessage(),
                    exception
            );
        }
    }

    public Event constructWebhookEvent(String payload, String signatureHeader) {
        if (!StringUtils.hasText(stripeProperties.getWebhookSecret())) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe webhook secret is not configured"
            );
        }

        if (!StringUtils.hasText(signatureHeader)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing Stripe-Signature header");
        }

        try {
            return Webhook.constructEvent(payload, signatureHeader, stripeProperties.getWebhookSecret());
        } catch (SignatureVerificationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe webhook signature", exception);
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported Stripe currency configuration", exception);
        }
    }

    private String buildSuccessUrl(Long reservationId) {
        return joinUrl(stripeProperties.getFrontendBaseUrl(), stripeProperties.getSuccessPath())
                + "?payment=success&reservationId=" + reservationId + "&session_id={CHECKOUT_SESSION_ID}";
    }

    private String buildCancelUrl(Long reservationId) {
        return joinUrl(stripeProperties.getFrontendBaseUrl(), stripeProperties.getCancelPath())
                + "?payment=cancel&reservationId=" + reservationId;
    }

    private String buildInvoiceDescription(Reservation reservation) {
        String baseDescription = String.format(
                "CampConnect reservation #%d for %s (%d participant%s)",
                reservation.getId(),
                reservation.getEvent().getTitre(),
                reservation.getNombreParticipants(),
                reservation.getNombreParticipants() != null && reservation.getNombreParticipants() > 1 ? "s" : ""
        );

        if (StringUtils.hasText(reservation.getDiscountLabel())) {
            return baseDescription + " - " + reservation.getDiscountLabel();
        }

        return baseDescription;
    }

    private String joinUrl(String baseUrl, String path) {
        String safeBaseUrl = StringUtils.trimWhitespace(baseUrl);
        String safePath = StringUtils.trimWhitespace(path);

        if (!StringUtils.hasText(safeBaseUrl) || !StringUtils.hasText(safePath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe frontend redirect URLs are not configured");
        }

        boolean baseEndsWithSlash = safeBaseUrl.endsWith("/");
        boolean pathStartsWithSlash = safePath.startsWith("/");

        if (baseEndsWithSlash && pathStartsWithSlash) {
            return safeBaseUrl.substring(0, safeBaseUrl.length() - 1) + safePath;
        }

        if (!baseEndsWithSlash && !pathStartsWithSlash) {
            return safeBaseUrl + "/" + safePath;
        }

        return safeBaseUrl + safePath;
    }
}
