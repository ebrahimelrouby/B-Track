package com.btrack.common.sms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Sends SMS via Twilio's REST API (no SDK dependency — plain HTTP). Trial
 * Twilio accounts can only send to phone numbers verified in the Twilio
 * console; upgrade the account to lift that restriction in production.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final RestTemplate restTemplate;

    @Value("${btrack.sms.twilio-account-sid:}")
    private String accountSid;

    @Value("${btrack.sms.twilio-auth-token:}")
    private String authToken;

    @Value("${btrack.sms.twilio-from-number:}")
    private String fromNumber;

    public void sendPasswordResetSms(String toPhoneNumber, String resetToken) {
        if (accountSid.isBlank() || authToken.isBlank() || fromNumber.isBlank()) {
            throw new IllegalStateException("Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER)");
        }

        String url = "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json".formatted(accountSid);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", toPhoneNumber);
        form.add("From", fromNumber);
        form.add("Body", "Your B-Track password reset code: " + resetToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String credentials = Base64.getEncoder().encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + credentials);

        try {
            restTemplate.postForObject(url, new HttpEntity<>(form, headers), Map.class);
        } catch (RestClientException e) {
            log.error("Failed to send password reset SMS to {}", toPhoneNumber, e);
            throw new IllegalStateException("SMS delivery failed", e);
        }
    }
}
