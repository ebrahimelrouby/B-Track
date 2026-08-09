package com.btrack.common.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${btrack.mail.from}")
    private String fromAddress;

    public void sendPasswordResetEmail(String toEmail, String resetToken, long expiryMinutes) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Reset your B-Track password");
        message.setText("""
                We received a request to reset your B-Track password.

                Enter this code in the app's Reset Password screen:

                %s

                This code expires in %d minutes. If you didn't request this, you can ignore this email.
                """.formatted(resetToken, expiryMinutes));

        try {
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", toEmail, e);
            throw e;
        }
    }
}
