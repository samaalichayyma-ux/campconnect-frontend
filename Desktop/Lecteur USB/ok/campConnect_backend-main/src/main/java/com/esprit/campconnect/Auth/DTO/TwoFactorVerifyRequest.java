package com.esprit.campconnect.Auth.DTO;

import lombok.Data;

@Data
public class TwoFactorVerifyRequest {
    private String code;
}