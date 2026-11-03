package com.btrack.modules.user.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.common.response.PagedResponse;
import com.btrack.modules.user.dto.AdminUserResponse;
import com.btrack.modules.user.dto.AdminUserStatsResponse;
import com.btrack.modules.user.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin — Users")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "List registered users (admin), with online status")
    public ResponseEntity<ApiResponse<PagedResponse<AdminUserResponse>>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.listUsers(search, page, size)));
    }

    @GetMapping("/stats")
    @Operation(summary = "User registration/activity statistics")
    public ResponseEntity<ApiResponse<AdminUserStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(adminUserService.getStats()));
    }
}
