package com.btrack.config;

import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableAsync
public class AppConfig {

    // Plain HttpURLConnection (RestTemplate's default factory) fails the TLS
    // handshake against raw.githubusercontent.com from inside this container —
    // HttpClient5 negotiates it correctly.
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate(new HttpComponentsClientHttpRequestFactory(HttpClients.createDefault()));
    }
}
