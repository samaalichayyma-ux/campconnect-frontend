package com.esprit.campconnect.Event.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventImageDTO {

    private Long id;
    private String imageName;
    private String imageUrl;
    private String description;
    private Boolean isPrimary;
    private Integer displayOrder;
    private String mimeType;
    private Long fileSize;
    private Long eventId;
    private LocalDateTime uploadDate;
    private LocalDateTime lastModified;

    // Computed field for image availability
    private Boolean isAvailable;
}
