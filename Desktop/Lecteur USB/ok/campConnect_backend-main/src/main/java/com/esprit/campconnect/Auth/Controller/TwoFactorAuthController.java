package com.esprit.campconnect.Auth.Controller;

import com.esprit.campconnect.Auth.DTO.TwoFactorSetupResponse;
import com.esprit.campconnect.Auth.DTO.TwoFactorStatusResponse;
import com.esprit.campconnect.Auth.DTO.TwoFactorVerifyRequest;
import com.esprit.campconnect.Auth.Service.TwoFactorAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth/2fa")
@RequiredArgsConstructor
@CrossOrigin("*")
public class TwoFactorAuthController {

    private final TwoFactorAuthService twoFactorAuthService;

    @PostMapping("/setup")
    public TwoFactorSetupResponse setup(Authentication authentication) {
        String email = authentication.getName();
        return twoFactorAuthService.setupTwoFactor(email);
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@RequestBody TwoFactorVerifyRequest request,
                                      Authentication authentication) {
        String email = authentication.getName();
        boolean success = twoFactorAuthService.verifyAndEnableTwoFactor(email, request.getCode());

        return Map.of(
                "success", success,
                "message", success ? "2FA activé avec succès" : "Code OTP invalide"
        );
    }

    @PostMapping("/disable")
    public Map<String, String> disable(Authentication authentication) {
        String email = authentication.getName();
        twoFactorAuthService.disableTwoFactor(email);

        return Map.of("message", "2FA désactivé avec succès");
    }

    @GetMapping("/status")
    public TwoFactorStatusResponse status(Authentication authentication) {
        String email = authentication.getName();

        return new TwoFactorStatusResponse(
                twoFactorAuthService.isTwoFactorEnabled(email),
                twoFactorAuthService.isTwoFactorVerified(email)
        );
    }
}