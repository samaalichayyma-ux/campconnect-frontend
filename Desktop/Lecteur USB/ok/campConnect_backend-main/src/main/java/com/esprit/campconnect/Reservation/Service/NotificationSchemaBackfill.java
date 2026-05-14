package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Reservation.Enum.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationSchemaBackfill implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        String columnType = jdbcTemplate.query(
                """
                SELECT COLUMN_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'user_notifications'
                  AND COLUMN_NAME = 'notification_type'
                """,
                rs -> rs.next() ? rs.getString("COLUMN_TYPE") : null
        );

        if (columnType == null) {
            log.warn("Skipping notification schema backfill because user_notifications.notification_type was not found");
            return;
        }

        List<String> expectedValues = Arrays.stream(NotificationType.values())
                .map(Enum::name)
                .toList();

        boolean alreadyAligned = expectedValues.stream()
                .allMatch(value -> columnType.contains("'" + value + "'"));
        if (alreadyAligned) {
            return;
        }

        String enumDefinition = expectedValues.stream()
                .map(value -> "'" + value + "'")
                .collect(Collectors.joining(","));
        jdbcTemplate.execute(
                "ALTER TABLE user_notifications MODIFY COLUMN notification_type ENUM(" + enumDefinition + ") NOT NULL"
        );
        log.info("Aligned user_notifications.notification_type enum values with the reservation notification module");
    }
}
