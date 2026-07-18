package com.pdks.backend.repository;

import com.pdks.backend.entity.SuspiciousAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SuspiciousAttemptRepository extends JpaRepository<SuspiciousAttempt, Long> {
}
