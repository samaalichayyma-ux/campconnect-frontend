package com.esprit.campconnect.Reservation.Service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationSchemaBackfillTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    void runAlignsNotificationEnumWhenNewValuesAreMissing() {
        NotificationSchemaBackfill backfill = new NotificationSchemaBackfill(jdbcTemplate);
        when(jdbcTemplate.query(contains("INFORMATION_SCHEMA.COLUMNS"), any(ResultSetExtractor.class)))
                .thenReturn("enum('BOOKING_CONFIRMED','REFUND_PROCESSED','WAITLIST_JOINED','WAITLIST_PROMOTED')");

        backfill.run(new DefaultApplicationArguments(new String[0]));

        verify(jdbcTemplate).execute(contains("ALTER TABLE user_notifications MODIFY COLUMN notification_type ENUM("));
    }

    @Test
    void runSkipsAlterWhenNotificationEnumIsAlreadyAligned() {
        NotificationSchemaBackfill backfill = new NotificationSchemaBackfill(jdbcTemplate);
        when(jdbcTemplate.query(contains("INFORMATION_SCHEMA.COLUMNS"), any(ResultSetExtractor.class)))
                .thenReturn(
                        "enum('BOOKING_CONFIRMED','PAYMENT_CONFIRMED','WAITLIST_JOINED','WAITLIST_PROMOTED',"
                                + "'WAITLIST_OFFER_EXPIRED','REFUND_PROCESSED','EVENT_REMINDER',"
                                + "'EVENT_POSTPONED','EVENT_CANCELLED','EVENT_STARTED','EVENT_COMPLETED',"
                                + "'ATTENDANCE_RECORDED','FEEDBACK_REQUESTED')"
                );

        backfill.run(new DefaultApplicationArguments(new String[0]));

        verify(jdbcTemplate, never()).execute(any(String.class));
    }
}
