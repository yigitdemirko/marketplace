package com.marketplace.notification.integration;

import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.GreenMailUtil;
import com.icegreen.greenmail.util.ServerSetupTest;
import com.marketplace.notification.infrastructure.client.UserContact;
import com.marketplace.notification.infrastructure.client.UserContactClient;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Tag("integration")
@SpringBootTest
@ActiveProfiles("test")
@EmbeddedKafka(partitions = 1, topics = {
        "order.created", "order.cancelled", "payment.completed", "payment.failed"
})
class NotificationEmailIntegrationTest {

    @RegisterExtension
    static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP)
            .withPerMethodLifecycle(false);

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockitoBean
    private UserContactClient userContactClient;

    @BeforeEach
    void resetMail() throws Exception {
        greenMail.purgeEmailFromAllMailboxes();
    }

    @Test
    void should_DeliverOrderCreatedEmail_ToResolvedUserAddress() throws Exception {
        when(userContactClient.getContact("user-1"))
                .thenReturn(new UserContact("user-1", "buyer@example.com"));

        kafkaTemplate.send("order.created", "order-42", Map.of(
                "orderId", "order-42",
                "userId", "user-1"
        ));

        await().atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> assertThat(greenMail.getReceivedMessages()).hasSize(1));

        MimeMessage message = greenMail.getReceivedMessages()[0];
        assertThat(message.getAllRecipients()).extracting(Object::toString)
                .containsExactly("buyer@example.com");
        assertThat(message.getSubject()).isEqualTo("Order Created - order-42");
        assertThat(GreenMailUtil.getBody(message)).contains("order-42");
    }

    @Test
    void should_DeliverPaymentFailedEmail_WithReasonInBody() throws Exception {
        when(userContactClient.getContact("user-2"))
                .thenReturn(new UserContact("user-2", "decline@example.com"));

        kafkaTemplate.send("payment.failed", "order-99", Map.of(
                "orderId", "order-99",
                "userId", "user-2",
                "reason", "Card declined"
        ));

        await().atMost(Duration.ofSeconds(10))
                .untilAsserted(() -> assertThat(greenMail.getReceivedMessages()).hasSize(1));

        MimeMessage message = greenMail.getReceivedMessages()[0];
        assertThat(message.getAllRecipients()).extracting(Object::toString)
                .containsExactly("decline@example.com");
        assertThat(message.getSubject()).isEqualTo("Payment Failed - order-99");
        assertThat(GreenMailUtil.getBody(message))
                .contains("order-99")
                .contains("Card declined");
    }

    @Test
    void should_NotSendEmail_WhenUserContactLookupFails() {
        when(userContactClient.getContact("ghost"))
                .thenThrow(new RuntimeException("user-service unavailable"));

        kafkaTemplate.send("order.cancelled", "order-7", Map.of(
                "orderId", "order-7",
                "userId", "ghost"
        ));

        await().atMost(Duration.ofSeconds(5))
                .untilAsserted(() -> verify(userContactClient).getContact("ghost"));

        assertThat(greenMail.waitForIncomingEmail(1500, 1)).isFalse();
        assertThat(greenMail.getReceivedMessages()).isEmpty();
    }

    @Test
    void should_NotSendEmail_WhenContactHasNoEmail() {
        when(userContactClient.getContact(any()))
                .thenReturn(new UserContact("user-x", ""));

        kafkaTemplate.send("order.created", "order-blank", Map.of(
                "orderId", "order-blank",
                "userId", "user-x"
        ));

        await().atMost(Duration.ofSeconds(5))
                .untilAsserted(() -> verify(userContactClient).getContact("user-x"));

        assertThat(greenMail.waitForIncomingEmail(1500, 1)).isFalse();
        assertThat(greenMail.getReceivedMessages()).isEmpty();
        verify(userContactClient, never()).getContact("never-called");
    }
}
