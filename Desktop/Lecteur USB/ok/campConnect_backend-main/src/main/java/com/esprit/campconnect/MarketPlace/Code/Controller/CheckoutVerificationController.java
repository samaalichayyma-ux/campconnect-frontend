package com.esprit.campconnect.MarketPlace.Code.Controller;

import com.esprit.campconnect.MarketPlace.Code.Entity.CheckoutCodeRequest;
import com.esprit.campconnect.MarketPlace.Code.Service.CheckoutVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.cloudinary.AccessControlRule.AccessType.token;

@RestController
@RequestMapping("/checkout-verification")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class CheckoutVerificationController {

    private final CheckoutVerificationService checkoutVerificationService;

    @PostMapping("/send-code/{userId}")
    public ResponseEntity<?> sendCheckoutCode(@PathVariable Long userId) {
        try {
            checkoutVerificationService.sendCheckoutCode(userId);
            return ResponseEntity.ok("Code envoyé par SMS.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCheckoutCode(@RequestBody CheckoutCodeRequest request) {
        try {
            boolean isValid = checkoutVerificationService.verifyCheckoutCode(
                    request.getUserId(),
                    request.getCode()
            );

            if (isValid) {
                return ResponseEntity.ok("Code validé.");
            }

            return ResponseEntity.badRequest().body("Code invalide.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}