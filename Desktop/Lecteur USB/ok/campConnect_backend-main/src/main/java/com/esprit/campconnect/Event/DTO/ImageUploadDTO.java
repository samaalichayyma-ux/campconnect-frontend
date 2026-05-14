package com.esprit.campconnect.Event.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonProperty;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ImageUploadDTO {

    @Size(max = 500, message = "L'URL de l'image bannière ne peut pas dépasser 500 caractères")
    @JsonProperty("bannerImage")
    private String bannerImage;

    @Size(max = 500, message = "L'URL de l'image miniature ne peut pas dépasser 500 caractères")
    @JsonProperty("thumbnailImage")
    private String thumbnailImage;

    @Size(max = 5000, message = "La galerie d'images ne peut pas dépasser 5000 caractères")
    @JsonProperty("galleryImages")
    private String galleryImages; // JSON array of image URLs: ["url1", "url2", ...]

}
