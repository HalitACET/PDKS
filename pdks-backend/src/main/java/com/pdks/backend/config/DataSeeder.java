package com.pdks.backend.config;

import com.pdks.backend.entity.Role;
import com.pdks.backend.entity.User;
import com.pdks.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Uygulama ayağa kalkarken çalışır.
 * users tablosu boşsa test kullanıcısını ekler.
 * Geliştirme kolaylığı için — production'da kaldırılmalı veya devre dışı bırakılmalı.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Tabloda hiç kayıt yoksa seed et
        if (userRepository.count() == 0) {
            User testUser = User.builder()
                    .firmId("ATLAS01")
                    .username("mehmet.yilmaz")
                    .password(passwordEncoder.encode("Ilk12345")) // BCrypt hash
                    .fullName("Mehmet Yılmaz")
                    .role(Role.EMPLOYEE)
                    .mustChangePassword(true)
                    .active(true)
                    .build();

            userRepository.save(testUser);
            log.info("Test kullanıcısı oluşturuldu: firmId=ATLAS01, username=mehmet.yilmaz");
        } else {
            log.info("Veritabanında kayıt mevcut, seed atlandı.");
        }
    }
}
