package com.pdks.backend.dto;

import com.pdks.backend.entity.TransactionType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NextActionResponse {

    private TransactionType suggestedType;
    private LastTransactionInfo lastTransaction;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LastTransactionInfo {
        private TransactionType type;
        private LocalDateTime timestamp;
        private String locationName;
    }
}
