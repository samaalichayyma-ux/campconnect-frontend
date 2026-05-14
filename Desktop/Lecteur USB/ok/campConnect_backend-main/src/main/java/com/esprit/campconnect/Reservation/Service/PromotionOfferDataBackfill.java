package com.esprit.campconnect.Reservation.Service;

import com.esprit.campconnect.Reservation.Repository.PromotionOfferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class PromotionOfferDataBackfill implements ApplicationRunner {

    private final PromotionOfferRepository promotionOfferRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!hasColumn("promotion_offer", "applies_to_all_events")
                || !hasTable("promotion_offer_event")) {
            log.warn("Skipping promotion backfill because legacy promotion schema is not present");
            return;
        }

        int updatedPromotions = promotionOfferRepository.backfillLegacyGlobalPromotions();
        if (updatedPromotions > 0) {
            log.info("Backfilled {} legacy promotions to global scope", updatedPromotions);
        }
    }

    private boolean hasTable(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                """,
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }

    private boolean hasColumn(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
                """,
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }
}
