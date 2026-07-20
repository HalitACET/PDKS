package com.pdks.backend.repository;

import com.pdks.backend.entity.DeletedTransactionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeletedTransactionLogRepository extends JpaRepository<DeletedTransactionLog, Long> {
}
