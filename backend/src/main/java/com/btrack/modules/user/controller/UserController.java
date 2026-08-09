package com.btrack.modules.user.controller;

import com.btrack.common.response.ApiResponse;
import com.btrack.modules.auth.security.BTrackPrincipal;
import com.btrack.modules.user.dto.UpdateProfileRequest;
import com.btrack.modules.user.dto.UserResponse;
import com.btrack.modules.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(@AuthenticationPrincipal BTrackPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(UserResponse.from(userService.getUser(principal.getUserId()))));
    }

    @PatchMapping("/me")
    @Operation(summary = "Update profile (used for onboarding and settings)")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal BTrackPrincipal principal,
            @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(UserResponse.from(userService.updateProfile(principal.getUserId(), request))));
    }
}
