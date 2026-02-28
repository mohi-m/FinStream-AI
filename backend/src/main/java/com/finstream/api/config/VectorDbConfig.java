package com.finstream.api.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Configures datasources. The primary DataSource (used by JPA / Flyway)
 * is explicitly marked {@code @Primary} so that the secondary vector DB
 * datasource does not interfere with auto-configuration.
 */
@Configuration
public class VectorDbConfig {

    /**
     * Re-declare the auto-configured DataSource as {@code @Primary} so JPA,
     * Flyway, and every other Spring component that needs "the" datasource
     * continues to use {@code spring.datasource.*}.
     */
    @Primary
    @Bean("dataSource")
    public DataSource primaryDataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }

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
