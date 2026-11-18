package com.kurilabo.user.api;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MergeGuestClientRequest(@NotNull UUID targetUserId) {}
