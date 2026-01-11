package com.finstream.api;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class FinStreamApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(FinStreamApiApplication.class, args);
    }

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("FinStream API")
                        .version("1.0.0")
                        .description("Portfolio & Financial Data REST API"));
    }
}
