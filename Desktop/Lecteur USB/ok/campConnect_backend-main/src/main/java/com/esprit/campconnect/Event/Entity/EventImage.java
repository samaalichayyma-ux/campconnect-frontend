package com.esprit.campconnect.Event.Entity;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_image")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "event")
public class EventImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String imageName; // Original file name

    @Column(nullable = false)
    private String imageUrl; // URL or path to the image file

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageData; // Base64 encoded image data (optional)

    @Column(columnDefinition = "TEXT")
    private String description; // Optional description of the image

    @Column(nullable = false)
    private Boolean isPrimary = false; // Flag to mark primary/main image

    @Column(nullable = false)
    private Integer displayOrder = 0; // Order of display in gallery

    @Column(nullable = false)
    private String mimeType; // MIME type of the image (e.g., image/jpeg)

    @Column(nullable = false)
    private Long fileSize; // Size of the file in bytes

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    @JsonIgnore
    private Event event;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadDate = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime lastModified = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.lastModified = LocalDateTime.now();
    }
}
