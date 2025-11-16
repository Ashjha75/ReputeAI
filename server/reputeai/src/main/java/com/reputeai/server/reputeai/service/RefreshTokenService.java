package com.reputeai.server.reputeai.service;

import com.reputeai.server.reputeai.domain.entity.RefreshToken;

public interface RefreshTokenService {
    RefreshToken createRefreshToken(Long userId);
    RefreshToken verifyExpiration(RefreshToken token);
}