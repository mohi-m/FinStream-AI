package com.finstream.api.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Configures a secondary DataSource and JdbcTemplate pointing at the
 * pgvector database ({@code finstream-pgvector}).
 * <p>
 * The primary DataSource used by JPA / Flyway is auto-configured by
 * Spring Boot from {@code spring.datasource.*} and remains unaffected.
 */
@Configuration
public class VectorDbConfig {

    @Bean("vectorDataSource")
    public DataSource vectorDataSource(
            @Value("${vector-db.datasource.url}") String url,
            @Value("${vector-db.datasource.username}") String username,
            @Value("${vector-db.datasource.password}") String password) {

        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName("org.postgresql.Driver")
                .build();
    }

    @Bean("vectorJdbcTemplate")
    public JdbcTemplate vectorJdbcTemplate(
            @Qualifier("vectorDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
