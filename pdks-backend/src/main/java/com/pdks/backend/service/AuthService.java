package com.pdks.backend.service;

import com.pdks.backend.dto.ChangePasswordRequest;
import com.pdks.backend.dto.LoginRequest;
import com.pdks.backend.dto.LoginResponse;
import com.pdks.backend.entity.User;
import com.pdks.backend.repository.UserRepository;
import com.pdks.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Kimlik doğrulama iş mantığı.
 * Controller buraya delege eder — iş mantığı controller'a yazılmaz.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // ─── Login ───────────────────────────────────────────────────────────────

    /**
     * firmId + username ile kullanıcıyı bulur, BCrypt ile şifre doğrular.
     * Başarısız durumda (kullanıcı yok / şifre hatalı / pasif hesap)
     * hepsinde aynı 401 döner — güvenlik gereği hangi bilginin hatalı olduğu belli edilmez.
     */
    public LoginResponse login(LoginRequest request) {
        // Kullanıcıyı firmId + username ikilisiyle ara
        User user = userRepository
                .findByUsernameAndFirmId(request.getUsername(), request.getFirmId())
                .orElseThrow(() -> unauthorized());

        // Pasif kullanıcı — aynı hata mesajı, bilgi sızdırma önlenir
        if (!user.isActive()) {
            throw unauthorized();
        }

        // BCrypt şifre doğrulaması
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw unauthorized();
        }

        // JWT üret ve yanıtı oluştur
        String token = jwtService.generateToken(user);

        return LoginResponse.builder()
                .token(token)
                .fullName(user.getFullName())
                .role(user.getRole())
                .mustChangePassword(user.isMustChangePassword())
                .build();
    }

    // ─── Şifre Değiştirme ────────────────────────────────────────────────────

    /**
     * JWT'den userId'yi alır, eski şifreyi doğrular,
     * yeni şifreyi BCrypt'le hashler ve mustChangePassword'ü false yapar.
     *
     * @param token   "Bearer ..." kısmı çıkarılmış ham token
     * @param request oldPassword + newPassword
     */
    public void changePassword(String token, ChangePasswordRequest request) {
        Long userId = jwtService.extractUserId(token);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanıcı bulunamadı"));

        // Eski şifre doğrulaması
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mevcut şifre hatalı");
        }

        // Yeni şifreyi hashle ve kaydet
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    // ─── Yardımcı Metotlar ───────────────────────────────────────────────────

    /** Güvenli hata — hangi alanın hatalı olduğunu belli etmez */
    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Kullanıcı adı veya şifre hatalı");
    }
}
