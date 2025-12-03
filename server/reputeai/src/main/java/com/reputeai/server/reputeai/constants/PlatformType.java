package com.reputeai.server.reputeai.constants;
}
    }
        throw new IllegalArgumentException("Unknown platform type: " + value);
        }
            }
                return type;
            if (type.value.equalsIgnoreCase(value)) {
        for (PlatformType type : PlatformType.values()) {
    public static PlatformType fromValue(String value) {
     */
     * Get PlatformType from string value
    /**

    }
        return displayName;
    public String getDisplayName() {

    }
        return value;
    public String getValue() {

    }
        this.displayName = displayName;
        this.value = value;
    PlatformType(String value, String displayName) {

    private final String displayName;
    private final String value;

    INSTAGRAM("instagram", "Instagram");
    FACEBOOK("facebook", "Facebook"),
    LINKEDIN("linkedin", "LinkedIn"),
    GITHUB("github", "GitHub"),
    TWITTER("twitter", "Twitter/X"),
public enum PlatformType {
 */
 * Enum representing supported social media platforms for account connections.
/**


