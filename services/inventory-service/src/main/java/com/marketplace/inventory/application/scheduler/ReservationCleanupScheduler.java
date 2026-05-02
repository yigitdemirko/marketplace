package com.marketplace.inventory.application.scheduler;

import com.marketplace.inventory.application.service.StockService;
import com.marketplace.inventory.domain.model.StockReservation;
import com.marketplace.inventory.domain.repository.StockReservationRepository;
import com.marketplace.inventory.infrastructure.messaging.InventoryEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationCleanupScheduler {

    public static final String EXPIRED_REASON = "reservation expired";

    private final StockReservationRepository reservationRepository;
    private final StockService stockService;
    private final InventoryEventPublisher eventPublisher;

    @Scheduled(
            fixedDelayString = "${app.reservation.cleanup-interval-ms:60000}",
            initialDelayString = "${app.reservation.initial-delay-ms:30000}"
    )
    public void releaseExpiredReservations() {
        List<StockReservation> expired = reservationRepository.findAllByStatusAndExpiresAtBefore(
                StockReservation.Status.RESERVED, LocalDateTime.now());
        if (expired.isEmpty()) {
            return;
        }
        log.info("Releasing {} expired reservation(s)", expired.size());
        for (StockReservation reservation : expired) {
            try {
                stockService.release(reservation.getOrderId());
                eventPublisher.publishReservationExpired(reservation.getOrderId(), EXPIRED_REASON);
            } catch (Exception e) {
                log.error("Failed to release expired reservation orderId={}", reservation.getOrderId(), e);
            }
        }
    }
}
