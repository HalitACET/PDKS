package com.pdks.backend.repository;

import com.pdks.backend.entity.TransactionRecord;
import com.pdks.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransactionRecordRepository extends JpaRepository<TransactionRecord, Long> {
    Optional<TransactionRecord> findTopByUserOrderByTimestampDesc(User user);
    Page<TransactionRecord> findByUserOrderByTimestampDesc(User user, Pageable pageable);
    Optional<TransactionRecord> findByUserAndDeviceIdAndTimestampBetween(User user, String deviceId, java.time.LocalDateTime start, java.time.LocalDateTime end);
}
