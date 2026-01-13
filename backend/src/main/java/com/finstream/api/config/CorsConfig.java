package com.finstream.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    private static final Logger log = LoggerFactory.getLogger(CorsConfig.class);

    // Comma-separated list of origins. Example: "http://localhost:3000,http://localhost:5173"
    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Use patterns to allow flexible origins if needed (e.g., http://localhost:*)
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Location")
                .allowCredentials(true)
                .maxAge(3600);

        try {
            log.info("CORS configured for origins: {}", String.join(", ", allowedOrigins));
        } catch (Exception ignored) {
            // Avoid any edge-case failures in logging
        }
    }
}

