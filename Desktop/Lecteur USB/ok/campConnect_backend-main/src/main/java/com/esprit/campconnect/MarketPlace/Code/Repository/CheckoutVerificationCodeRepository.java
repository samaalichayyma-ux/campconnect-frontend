package com.esprit.campconnect.MarketPlace.Code.Repository;

import com.esprit.campconnect.MarketPlace.Code.Entity.CheckoutVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CheckoutVerificationCodeRepository extends JpaRepository<CheckoutVerificationCode, Long> {
    Optional<CheckoutVerificationCode> findTopByUserIdAndUsedFalseOrderByIdDesc(Long userId);
}