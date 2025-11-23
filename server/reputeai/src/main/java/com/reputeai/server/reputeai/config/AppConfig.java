package com.reputeai.server.reputeai.config;// In com.reputeai.server.reputeai.config.AppConfig.java

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean
    public ObjectMapper objectMapper() {
        // This module is essential for correct date/time serialization in the cache.
        return new ObjectMapper().registerModule(new JavaTimeModule());
    }


}