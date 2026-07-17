package com.pdks.backend.config;

import com.pdks.backend.entity.Location;
import com.pdks.backend.entity.Role;
import com.pdks.backend.entity.User;
import com.pdks.backend.repository.LocationRepository;
import com.pdks.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Uygulama ayağa kalkarken çalışır.
 * Geliştirme kolaylığı için test kullanıcıları oluşturur.
 * Production'da kaldırılmalı veya devre dışı bırakılmalı.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LocationRepository locationRepository;

    @Override
    public void run(String... args) {
        seedEmployee();
        seedAdmin();
        seedLocations();
    }

    /** EMPLOYEE test kullanıcısı — yoksa oluştur */
    private void seedEmployee() {
        if (userRepository.findByUsernameAndFirmId("mehmet.yilmaz", "ATLAS01").isEmpty()) {
            User employee = User.builder()
                    .firmId("ATLAS01")
                    .username("mehmet.yilmaz")
                    .password(passwordEncoder.encode("Ilk12345"))
                    .fullName("Mehmet Yılmaz")
                    .role(Role.EMPLOYEE)
                    .mustChangePassword(true)
                    .active(true)
                    .build();
            userRepository.save(employee);
            log.info("EMPLOYEE seed: firmId=ATLAS01, username=mehmet.yilmaz");
        }
    }

    /** ADMIN test kullanıcısı — yoksa oluştur */
    private void seedAdmin() {
        if (userRepository.findByUsernameAndFirmId("admin", "ATLAS01").isEmpty()) {
            User admin = User.builder()
                    .firmId("ATLAS01")
                    .username("admin")
                    .password(passwordEncoder.encode("Admin1234"))
                    .fullName("PDKS Admin")
                    .role(Role.ADMIN)
                    .mustChangePassword(false)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("ADMIN seed: firmId=ATLAS01, username=admin");
        }
    }

    /** Test lokasyonu — yoksa oluştur */
    private void seedLocations() {
        if (locationRepository.findByFirmIdAndCode("ATLAS01", "ANAKAPI").isEmpty()) {
            Location loc = Location.builder()
                    .firmId("ATLAS01")
                    .code("ANAKAPI")
                    .name("Ana Kapı")
                    .latitude(40.1885)
                    .longitude(29.0610)
                    .radiusMeters(150)
                    .active(true)
                    .build();
            locationRepository.save(loc);
            log.info("Location seed: ATLAS01/ANAKAPI");
        }
    }
}
