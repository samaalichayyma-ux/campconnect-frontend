package com.esprit.campconnect.Auth.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TwoFactorSetupResponse {
    private String secret;
    private String otpAuthUrl;
    private String qrCodeBase64;
}