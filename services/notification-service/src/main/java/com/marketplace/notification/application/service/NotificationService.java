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

    public void sendOrderCreatedNotification(String recipientEmail, String orderId) {
        sendEmail(
                recipientEmail,
                "Bilbo's — Order Received: " + orderId,
                "Thank you for your order! Your order " + orderId + " has been received and is being processed.\n\nBilbo's — bilbos-shop.com"
        );
    }

    public void sendPaymentCompletedNotification(String recipientEmail, String orderId) {
        sendEmail(
                recipientEmail,
                "Bilbo's — Payment Confirmed: " + orderId,
                "Great news! Payment for your order " + orderId + " has been confirmed. We will notify you once your items are on their way.\n\nBilbo's — bilbos-shop.com"
        );
    }

    public void sendPaymentFailedNotification(String recipientEmail, String orderId, String reason) {
        sendEmail(
                recipientEmail,
                "Bilbo's — Payment Failed: " + orderId,
                "Unfortunately, the payment for your order " + orderId + " could not be processed. Reason: " + reason + "\n\nPlease try again at bilbos-shop.com"
        );
    }

    public void sendOrderCancelledNotification(String recipientEmail, String orderId) {
        sendEmail(
                recipientEmail,
                "Bilbo's — Order Cancelled: " + orderId,
                "Your order " + orderId + " has been cancelled. If you have any questions, please visit bilbos-shop.com\n\nBilbo's — bilbos-shop.com"
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
