package com.btrack.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private final boolean success;
    private final String message;
    // Always serialized, even when null — several endpoints legitimately return
    // null data (e.g. "no check-in submitted yet today"), and clients rely on
    // the `data` key being present to tell "null" apart from "missing"/undefined.
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private final T data;
    private final String errorCode;
    @Builder.Default
    private final Instant timestamp = Instant.now();

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }

    public static ApiResponse<Void> ok(String message) {
        return ApiResponse.<Void>builder().success(true).message(message).build();
    }

    public static ApiResponse<Void> error(String message, String errorCode) {
        return ApiResponse.<Void>builder().success(false).message(message).errorCode(errorCode).build();
    }
}
