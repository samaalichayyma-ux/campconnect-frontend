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
public class EventFeedbackDTO {

    private String reviewerName;
    private Integer rating;
    private String comment;
    private LocalDateTime submittedAt;
}
