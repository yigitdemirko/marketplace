package com.marketplace.notification.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final JavaMailSender mailSender;

    public void sendOrderCreatedNotification(String orderId, String userId) {
        sendEmail(
                "user@marketplace.com",
                "Order Created - " + orderId,
                "Your order " + orderId + " has been created successfully and is being processed."
        );
    }

    public void sendPaymentCompletedNotification(String orderId, String userId) {
        sendEmail(
                "user@marketplace.com",
                "Payment Confirmed - " + orderId,
                "Payment for your order " + orderId + " has been completed successfully."
        );
    }

    public void sendPaymentFailedNotification(String orderId, String userId, String reason) {
        sendEmail(
                "user@marketplace.com",
                "Payment Failed - " + orderId,
                "Payment for your order " + orderId + " has failed. Reason: " + reason
        );
    }

    public void sendOrderCancelledNotification(String orderId, String userId) {
        sendEmail(
                "user@marketplace.com",
                "Order Cancelled - " + orderId,
                "Your order " + orderId + " has been cancelled."
        );
    }

    private void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Email sent: to={}, subject={}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email: to={}, subject={}", to, subject, e);
        }
    }
}