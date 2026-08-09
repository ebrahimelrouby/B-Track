package com.btrack.modules.session.dto;

import java.util.UUID;

public record StartSessionRequest(
        UUID planId,
        UUID dayId,
        String name,
        String localSessionId
) {}
