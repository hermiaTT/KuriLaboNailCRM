package com.kurilabo.availability.application;

import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.time.LocalDate;

@Service
public class ScheduleLockService {

    private static final long LOCK_NAMESPACE = 0x4B55524900000000L;

    private final JdbcTemplate jdbcTemplate;

    public ScheduleLockService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void lockDate(LocalDate date) {
        long lockKey = LOCK_NAMESPACE ^ date.toEpochDay();
        jdbcTemplate.execute((ConnectionCallback<Void>) connection -> {
            try (PreparedStatement statement = connection.prepareStatement(
                    "SELECT pg_advisory_xact_lock(?)"
            )) {
                statement.setLong(1, lockKey);
                statement.execute();
            }
            return null;
        });
    }
}

