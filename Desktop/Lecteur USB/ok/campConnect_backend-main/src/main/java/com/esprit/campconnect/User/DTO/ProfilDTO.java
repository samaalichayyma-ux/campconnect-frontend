package com.esprit.campconnect.User.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProfilDTO {
    private String adresse;
    private String photo;
    private String biographie;
}