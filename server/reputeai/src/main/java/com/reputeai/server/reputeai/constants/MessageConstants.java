package com.reputeai.server.reputeai.constants;

public final class MessageConstants {

    // Private constructor to prevent instantiation
    private MessageConstants() {
        throw new AssertionError("Cannot instantiate constants class");
    }

    // Authentication & User Messages
    public static final String ERROR_USER_NOT_FOUND = "Error: User not found with email: ";
    public static final String ERROR_USER_NOT_FOUND_BY_ID = "User not found with ID: ";
    public static final String ERROR_ACCOUNT_DISABLED = "Error: Your account has been disabled.";
    public static final String ERROR_EMAIL_NOT_VERIFIED = "Error: Please verify your email before signing in.";
    public static final String ERROR_EMAIL_VERIFICATION_REQUIRED = "Email not verified. We've re-sent a verification OTP to your inbox.";
    public static final String ERROR_BAD_CREDENTIALS = "Error: Invalid credentials provided.";

    // Password Change Messages
    public static final String ERROR_PASSWORD_MISMATCH = "New password and confirmation do not match";
    public static final String ERROR_PASSWORD_SAME_AS_CURRENT = "New password must be different from current password";
    public static final String ERROR_CURRENT_PASSWORD_INCORRECT = "Current password is incorrect";

    // Email Verification & Forgot Password
    public static final String ERROR_OTP_INVALID = "Invalid or expired OTP";
    public static final String ERROR_EMAIL_ALREADY_VERIFIED = "Email already verified";
    public static final String ERROR_RESET_TOKEN_INVALID = "Invalid or expired password reset token";
    public static final String ERROR_REFRESH_TOKEN_INVALID = "Invalid or expired refresh token";

    // Rate Limiting
    public static final String ERROR_TOO_MANY_REQUESTS = "Too many requests. Please try again after 5 minutes.";

    public static final String SUCCESS_VERIFICATION_EMAIL_SENT = "Verification OTP generated and sent (simulated).";
    public static final String SUCCESS_EMAIL_VERIFIED = "Email verified successfully.";
    public static final String SUCCESS_PASSWORD_RESET_REQUESTED = "Password reset link generated (simulated).";
    public static final String SUCCESS_PASSWORD_RESET = "Password has been reset successfully.";
    public static final String SUCCESS_TOKEN_REFRESHED = "Access token refreshed successfully";
    public static final String SUCCESS_LOGOUT = "Logout successful";

    // Log Messages
    public static final String LOG_LOADING_USER = "Executing loadUserByUsername for {}.";
    public static final String LOG_AUTHORITIES_LOADED = "Final authorities loaded for user {}: {}";
    public static final String LOG_FETCHING_PROFILE = "Fetching user profile for email: {}";
    public static final String LOG_PROFILE_FETCHED = "Successfully fetched profile for user: {}";
    public static final String LOG_PASSWORD_CHANGE_ATTEMPT = "Attempting to change password for user: {}";
    public static final String LOG_PASSWORD_MISMATCH = "Password change failed for {}: New password and confirmation do not match";
    public static final String LOG_PASSWORD_SAME = "Password change failed for {}: New password must be different from current password";
    public static final String LOG_PASSWORD_INCORRECT = "Password change failed for {}: Current password is incorrect";
    public static final String LOG_PASSWORD_CHANGED = "Password changed successfully for user: {}";
    public static final String LOG_REQUESTING_EMAIL_VERIFICATION = "Requesting email verification OTP for {}";
    public static final String LOG_EMAIL_VERIFIED = "Email verified for {}";
    public static final String LOG_FORGOT_PASSWORD_REQUEST = "Forgot password request for {}";
    public static final String LOG_RESET_PASSWORD_SUCCESS = "Password reset successful for {}";
}