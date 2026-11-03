package com.btrack.modules.user.service;

import com.btrack.common.response.PagedResponse;
import com.btrack.modules.user.dto.AdminUserResponse;
import com.btrack.modules.user.dto.AdminUserStatsResponse;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    // Matches AdminUserResponse.ONLINE_THRESHOLD — a user is "online" if they've
    // made an authenticated request in the last 5 minutes.
    private static final Duration ONLINE_THRESHOLD = Duration.ofMinutes(5);

    private final UserRepository userRepository;

    public PagedResponse<AdminUserResponse> listUsers(String search, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = userRepository.search(search, pageable).map(AdminUserResponse::from);
        return PagedResponse.from(result);
    }

    public AdminUserStatsResponse getStats() {
        Instant onlineThreshold = Instant.now().minus(ONLINE_THRESHOLD);
        Instant todayStart = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant weekStart = todayStart.minus(Duration.ofDays(7));

        return new AdminUserStatsResponse(
                userRepository.countByDeletedAtIsNull(),
                userRepository.countByLastActiveAtAfterAndDeletedAtIsNull(onlineThreshold),
                userRepository.countByCreatedAtAfterAndDeletedAtIsNull(todayStart),
                userRepository.countByCreatedAtAfterAndDeletedAtIsNull(weekStart)
        );
    }
}
