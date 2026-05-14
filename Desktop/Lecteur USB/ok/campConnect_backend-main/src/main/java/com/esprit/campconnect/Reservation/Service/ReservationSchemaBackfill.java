package com.esprit.campconnect.Reservation.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationSchemaBackfill implements ApplicationRunner {

    private static final List<String> RESERVATION_STATUS_VALUES = List.of(
            "PENDING",
            "CONFIRMED",
            "PAID",
            "ATTENDED",
            "NO_SHOW",
            "CANCELLED",
            "REFUNDED"
    );

    private static final List<String> PAYMENT_STATUS_VALUES = List.of(
            "UNPAID",
            "PENDING",
            "PAID",
            "PARTIALLY_REFUNDED",
            "FAILED",
            "REFUNDED"
    );

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        ensureEnumColumnContainsValues("statut", RESERVATION_STATUS_VALUES);
        ensureEnumColumnContainsValues("statut_paiement", PAYMENT_STATUS_VALUES);
    }

    private void ensureEnumColumnContainsValues(String columnName, List<String> expectedValues) {
        String columnType = jdbcTemplate.query(
                """
                SELECT COLUMN_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'reservation'
                  AND COLUMN_NAME = ?
                """,
                rs -> rs.next() ? rs.getString("COLUMN_TYPE") : null,
                columnName
        );

        if (columnType == null) {
            log.warn("Skipping reservation schema backfill because column reservation.{} was not found", columnName);
            return;
        }

        boolean alreadyAligned = expectedValues.stream()
                .allMatch(value -> columnType.contains("'" + value + "'"));
        if (alreadyAligned) {
            return;
        }

        String enumDefinition = expectedValues.stream()
                .map(value -> "'" + value + "'")
                .collect(Collectors.joining(","));
        jdbcTemplate.execute(
                "ALTER TABLE reservation MODIFY COLUMN " + columnName + " ENUM(" + enumDefinition + ") NOT NULL"
        );
        log.info("Aligned reservation.{} enum values with the reservation module", columnName);
    }
}
