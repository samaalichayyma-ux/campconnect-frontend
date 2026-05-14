package com.esprit.campconnect.Auth.DTO;

import lombok.Data;

@Data
public class VerifyLogin2FARequest {
    private String tempToken;
    private String code;
}