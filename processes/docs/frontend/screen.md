## 📱 **COMPLETE UI SCREEN BREAKDOWN**

---

## **TOTAL SCREENS: 18 Screens**

### **Organized by User Journey:**

---

## 🔐 **1. AUTHENTICATION FLOW (3 Screens)**

### **Screen 1.1: Landing Page**
- **Purpose:** First impression, value proposition
- **Components:**
  - Hero section with tagline
  - Key features (3-4 cards)
  - "How it works" (3-step process)
  - Pricing tiers
  - CTA buttons (Sign Up / Login)
  - Footer with links

### **Screen 1.2: Sign Up Page**
- **Purpose:** User registration
- **Components:**
  - Full name input
  - Email input
  - Password input (with strength indicator)
  - Confirm password
  - Terms & conditions checkbox
  - "Create Account" button
  - "Already have account? Login" link
  - Social sign-up options (Google, LinkedIn)

### **Screen 1.3: Login Page**
- **Purpose:** Existing user authentication
- **Components:**
  - Email input
  - Password input
  - "Remember me" checkbox
  - "Forgot password?" link
  - "Login" button
  - "Don't have account? Sign up" link
  - Social login options

---

## 🏠 **2. MAIN DASHBOARD (1 Screen)**

### **Screen 2.1: Dashboard (Home)**
- **Purpose:** Overview of reputation health
- **Components:**
  - **Top Section:**
    - Welcome message with user name
    - Overall Reputation Score (large number with color coding)
    - Score trend graph (last 30 days)
  
  - **Stats Cards (4 Cards):**
    - Total Content Analyzed
    - Flagged Items (High Risk)
    - Platforms Connected
    - Last Scan Date
  
  - **Risk Distribution Chart:**
    - Donut/Pie chart showing Low/Medium/High/Critical
  
  - **Recent Alerts Section:**
    - List of 5 most recent high-risk detections
    - "View All Alerts" button
  
  - **Quick Actions:**
    - "Connect New Platform" button
    - "Run Full Scan" button
    - "View Reports" button
  
  - **Platform Status Cards:**
    - Twitter: Connected ✓ | Last synced: 2 hours ago
    - LinkedIn: Connected ✓ | Last synced: 1 day ago
    - GitHub: Not connected | "Connect" button
    - Reddit: Not connected | "Connect" button

---

## 🔌 **3. PLATFORM CONNECTION (5 Screens)**

### **Screen 3.1: Platform Connection Hub**
- **Purpose:** Central place to manage all platforms
- **Components:**
  - List of all supported platforms (cards)
  - Each card shows:
    - Platform logo and name
    - Connection status (Connected/Not Connected)
    - Last sync time
    - "Connect" or "Disconnect" button
    - "Settings" icon
  - "Add Custom Platform" option

### **Screen 3.2: Twitter Connection**
- **Purpose:** OAuth flow for Twitter
- **Components:**
  - Twitter logo
  - Explanation of what access is needed
  - Permissions list (read tweets, profile info)
  - "Authorize with Twitter" button
  - Privacy notice
  - "Cancel" button

### **Screen 3.3: LinkedIn Connection**
- **Purpose:** OAuth flow for LinkedIn
- **Components:**
  - Similar to Twitter connection
  - LinkedIn-specific permissions

### **Screen 3.4: GitHub Connection**
- **Purpose:** OAuth flow for GitHub
- **Components:**
  - Similar structure
  - GitHub-specific permissions

### **Screen 3.5: Manual Archive Upload**
- **Purpose:** For platforms without API (or backup method)
- **Components:**
  - Drag-and-drop file upload area
  - "Browse files" button
  - Supported formats info (ZIP, JSON, CSV)
  - Instructions on how to download archive
  - "Upload" button
  - Progress bar during upload

---

## 🔍 **4. CONTENT ANALYSIS (4 Screens)**

### **Screen 4.1: Content Library**
- **Purpose:** View all analyzed content
- **Components:**
  - **Top Filters Bar:**
    - Platform dropdown (All/Twitter/LinkedIn/etc.)
    - Risk level filter (All/Low/Medium/High/Critical)
    - Date range picker
    - Search box
    - "Export to CSV" button
  
  - **Content Table/List:**
    - Each row shows:
      - Platform icon
      - Content preview (first 100 chars)
      - Risk score (colored badge)
      - Date posted
      - Engagement (likes, shares)
      - Status (Active/Flagged/Deleted)
      - "View Details" button
  
  - **Pagination:**
    - Page numbers
    - Items per page dropdown
  
  - **Bulk Actions:**
    - Select checkboxes
    - "Delete Selected" button
    - "Archive Selected" button
    - "Mark as Reviewed" button

### **Screen 4.2: Content Detail View**
- **Purpose:** Deep dive into single piece of content
- **Components:**
  - **Left Panel (60%):**
    - Full content text
    - Original post link (external)
    - Posted date and time
    - Engagement metrics
    - Platform icon and username
    - Media attachments (if any)
  
  - **Right Panel (40%):**
    - **Risk Assessment Card:**
      - Overall risk score (big number)
      - Risk level badge
      - Risk breakdown:
        - Profanity: Low
        - Sentiment: Negative
        - Controversy: High
        - Brand Alignment: Medium
    
    - **AI Analysis Card:**
      - "Why this was flagged" explanation
      - Key phrases highlighted
      - Recommended action
    
    - **Action Buttons:**
      - "Keep Content" button
      - "Archive Content" button
      - "Delete Permanently" button
      - "Add to Exception List" button
  
  - **Activity Log:**
    - Timeline of actions on this content

### **Screen 4.3: Scan Progress**
- **Purpose:** Show real-time scanning status
- **Components:**
  - Progress bar (percentage)
  - Current action text ("Analyzing LinkedIn posts...")
  - Stats being updated live:
    - Posts scanned: 1,234 / 5,678
    - Flagged items: 23
    - Estimated time remaining: 2 minutes
  - "Pause Scan" button
  - "Cancel Scan" button
  - Real-time log (scrollable):
    - "✓ Analyzed tweet #12345 - Risk: Low"
    - "⚠ Flagged post #67890 - Risk: High"

### **Screen 4.4: Bulk Action Confirmation**
- **Purpose:** Confirm before mass deletion/archiving
- **Components:**
  - Warning message
  - Number of items affected
  - List preview (first 10 items)
  - Risk breakdown of selected items
  - "I understand, proceed" checkbox
  - "Confirm Action" button (disabled until checkbox)
  - "Cancel" button

---

## 📊 **5. ANALYTICS & REPORTS (2 Screens)**

### **Screen 5.1: Analytics Dashboard**
- **Purpose:** Visual insights and trends
- **Components:**
  - **Time Range Selector:**
    - Last 7 days / 30 days / 90 days / All time
  
  - **Key Metrics (4 Cards):**
    - Total Content Analyzed
    - Average Risk Score
    - Content Deleted
    - Reputation Improvement %
  
  - **Charts Section:**
    1. **Reputation Score Timeline** (Line chart)
       - X-axis: Time
       - Y-axis: Score (0-100)
       - Shows improvement over time
    
    2. **Content by Risk Level** (Bar chart)
       - Low / Medium / High / Critical
       - Color-coded bars
    
    3. **Platform Distribution** (Donut chart)
       - How content is distributed across platforms
    
    4. **Top Risk Categories** (Horizontal bar)
       - Profanity, Political, Toxic, etc.
       - Shows what issues are most common
  
  - **Export Options:**
    - "Download PDF Report" button
    - "Schedule Email Report" button

### **Screen 5.2: Generated Reports**
- **Purpose:** View and download past reports
- **Components:**
  - List of generated reports
  - Each report shows:
    - Report title
    - Generation date
    - Date range covered
    - File size
    - "Download" button
    - "Delete" button
  - "Generate New Report" button
  - Filter by date range

---

## ⚙️ **6. SETTINGS & CONFIGURATION (3 Screens)**

### **Screen 6.1: Profile Settings**
- **Purpose:** Manage user account
- **Components:**
  - **Personal Information:**
    - Profile photo upload
    - Full name input
    - Email (read-only, shows verification status)
    - "Change Email" button
  
  - **Security:**
    - Current password
    - New password
    - Confirm new password
    - "Change Password" button
    - "Enable 2FA" toggle
  
  - **Preferences:**
    - Language dropdown
    - Timezone dropdown
    - Date format
  
  - **Danger Zone:**
    - "Delete Account" button (red)
  
  - "Save Changes" button

### **Screen 6.2: Risk Configuration**
- **Purpose:** Customize what gets flagged
- **Components:**
  - **Risk Thresholds Sliders:**
    - Profanity sensitivity (0-100)
    - Political content sensitivity
    - Controversial topics sensitivity
    - Toxicity threshold
  
  - **Custom Keywords:**
    - "Add keyword" input
    - List of custom keywords (removable)
    - Import/Export keyword list
  
  - **Industry-Specific Rules:**
    - Dropdown to select industry
    - Pre-configured rule sets
  
  - **Whitelist/Exceptions:**
    - Add specific posts to exception list
    - Add specific phrases to ignore
  
  - "Save Configuration" button
  - "Reset to Defaults" button

### **Screen 6.3: Notification Settings**
- **Purpose:** Control alerts and notifications
- **Components:**
  - **Email Notifications:**
    - ☑ High-risk content detected
    - ☑ Scan completed
    - ☑ Weekly summary report
    - ☐ Marketing emails
  
  - **In-App Notifications:**
    - ☑ Real-time alerts
    - ☑ Viral content detection
  
  - **Alert Frequency:**
    - Instant / Hourly / Daily digest
  
  - **Monitoring Schedule:**
    - Enable/disable automatic scanning
    - Frequency dropdown (Daily/Weekly/Monthly)
    - Preferred scan time
  
  - "Save Preferences" button

---

## 🔔 **ADDITIONAL SCREENS**

### **Screen 7.1: Notifications Center**
- **Purpose:** View all alerts and notifications
- **Components:**
  - Tabs: All / Unread / High Priority
  - List of notifications
  - Each notification shows:
    - Icon (based on type)
    - Title
    - Description
    - Time ago
    - "Mark as read" option
  - "Clear all" button
  - "Mark all as read" button

### **Screen 7.2: Help & Support**
- **Purpose:** User assistance
- **Components:**
  - FAQ accordion
  - Search help articles
  - "Contact Support" form
  - Video tutorials
  - Documentation links
  - "Schedule demo" button

---

## 📋 **SCREEN SUMMARY TABLE**

| # | Screen Name | Priority | Complexity | Development Time |
|---|-------------|----------|------------|------------------|
| 1.1 | Landing Page | High | Medium | 2 days |
| 1.2 | Sign Up | High | Low | 1 day |
| 1.3 | Login | High | Low | 1 day |
| 2.1 | Dashboard | Critical | High | 3 days |
| 3.1 | Platform Hub | High | Medium | 2 days |
| 3.2-3.4 | OAuth Flows | High | Low | 1 day each |
| 3.5 | Archive Upload | Medium | Medium | 1 day |
| 4.1 | Content Library | Critical | High | 3 days |
| 4.2 | Content Detail | High | Medium | 2 days |
| 4.3 | Scan Progress | Medium | Medium | 2 days |
| 4.4 | Bulk Confirm | Low | Low | 1 day |
| 5.1 | Analytics | High | High | 3 days |
| 5.2 | Reports | Medium | Low | 1 day |
| 6.1 | Profile Settings | Medium | Low | 1 day |
| 6.2 | Risk Config | High | Medium | 2 days |
| 6.3 | Notifications | Low | Low | 1 day |
| 7.1 | Notification Center | Low | Low | 1 day |
| 7.2 | Help & Support | Low | Low | 1 day |

---

## 🎨 **UI/UX DESIGN PRINCIPLES**

### **Color Scheme:**
- **Primary:** Blue (#2563EB) - Trust, security
- **Success:** Green (#10B981) - Low risk, positive
- **Warning:** Orange (#F59E0B) - Medium risk
- **Danger:** Red (#EF4444) - High risk, critical
- **Neutral:** Gray shades for backgrounds

### **Risk Color Coding:**
- **Low (0-49):** Green 🟢
- **Medium (50-69):** Yellow 🟡
- **High (70-89):** Orange 🟠
- **Critical (90-100):** Red 🔴

### **Layout:**
- Sidebar navigation (collapsible on mobile)
- Top bar with user profile, notifications, search
- Responsive design (desktop, tablet, mobile)
- Dark mode toggle option

---

## 🚀 **MVP SCREENS (Start Here)**

**For 4-week timeline, prioritize these 8 screens:**

1. ✅ Login (1.3)
2. ✅ Sign Up (1.2)
3. ✅ Dashboard (2.1)
4. ✅ Platform Hub (3.1)
5. ✅ Twitter Connection (3.2)
6. ✅ Content Library (4.1)
7. ✅ Content Detail (4.2)
8. ✅ Profile Settings (6.1)

**Add later:**
- Analytics Dashboard (5.1)
- Risk Configuration (6.2)
- Scan Progress (4.3)
- Remaining OAuth flows

---

