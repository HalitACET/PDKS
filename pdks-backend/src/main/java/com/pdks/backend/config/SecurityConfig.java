package com.pdks.backend.config;

import com.pdks.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 6 yapılandırması.
 *
 * Kurallar:
 *  - WebSecurityConfigurerAdapter KULLANILMAZ (Spring 6'da kaldırıldı)
 *  - SecurityFilterChain bean + lambda DSL
 *  - Oturum yönetimi STATELESS — JWT tabanlı sistem
 *  - /admin/** yolları sadece ADMIN rolüne açık
 *  - @PreAuthorize için @EnableMethodSecurity aktif
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF, REST API için devre dışı (token tabanlı auth kullanılıyor)
            .csrf(AbstractHttpConfigurer::disable)

            // Stateless — sunucu tarafında hiç session tutulmaz
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Endpoint izinleri
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/health").permitAll()
                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/error").permitAll()
                // Admin yolları sadece ADMIN rolüne açık
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // Diğer tüm istekler JWT gerektirir
                .anyRequest().authenticated()
            )

            // JWT filtresini UsernamePasswordAuthenticationFilter'dan önce ekle
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * BCrypt şifre encoder — tüm şifre hash/doğrulama işlemlerinde kullanılır.
     * Şifreler asla düz metin olarak saklanmaz.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
