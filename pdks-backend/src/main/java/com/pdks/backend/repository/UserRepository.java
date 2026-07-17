package com.pdks.backend.repository;

import com.pdks.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * User tablosu için JPA repository.
 * Login her zaman firmId + username ikilisiyle yapılır —
 * aynı username farklı firmalarda bulunabilir.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Firma kodu ve kullanıcı adına göre kullanıcı arar.
     * Login akışında kullanılır.
     */
    Optional<User> findByUsernameAndFirmId(String username, String firmId);
}
