package com.pdks.backend.repository;

import com.pdks.backend.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    List<Shift> findByFirmId(String firmId);
    Optional<Shift> findByFirmIdAndId(String firmId, Long id);
}
