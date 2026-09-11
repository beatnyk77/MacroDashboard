# Google Play Store — Mandatory Data Safety Form Declaration

**Application**: GraphiQuestor: Macro Terminal  
**Package Name**: `com.graphiquestor.terminal`  

This document specifies the exact answers to submit in the **Google Play Console > Policy and Programs > App Content > Data Safety** section. Adhering strictly to these answers prevents delays, rejections, or policy warning strikes.

---

## 1. Overview Questions

* **Does your app collect or share any of the required user data types?**
  * **Answer**: **NO**. GraphiQuestor is a pure telemetry terminal. It does NOT collect personal identifiers, names, phone numbers, email addresses, financial accounts, or location data.
* **Is all of the user data collected by your app encrypted in transit?**
  * **Answer**: **YES**. All communication between the app and the edge CDN/Supabase infrastructure uses TLS 1.3 / HTTPS.
* **Do you provide a way for users to request that their data be deleted?**
  * **Answer**: **YES** (via privacy contact email `privacy@graphiquestor.com`, or in-app local cache wipe via standard Android App Info > Clear Storage).

---

## 2. Specific Data Categories Breakdown

| Category | Collected? | Shared with 3rd Parties? | Ephemeral / Stored? | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Location** (Approximate/Precise) | ❌ NO | ❌ NO | N/A | None |
| **Personal Info** (Name, Email, Address, Phone, National ID) | ❌ NO | ❌ NO | N/A | None |
| **Financial Info** (Credit Card, Bank Account, Salary) | ❌ NO | ❌ NO | N/A | None |
| **Health & Fitness** | ❌ NO | ❌ NO | N/A | None |
| **Messages** (SMS, Chat) | ❌ NO | ❌ NO | N/A | None |
| **Photos & Videos** | ❌ NO | ❌ NO | N/A | None |
| **Audio Files** | ❌ NO | ❌ NO | N/A | None |
| **Files & Documents** | ❌ NO | ❌ NO | N/A | None |
| **Calendar & Contacts** | ❌ NO | ❌ NO | N/A | None |
| **App Activity** (Page Views, Clicks, User Content) | ❌ NO | ❌ NO | N/A | All watchlist pins & alert thresholds stored **100% locally on-device in Room SQLite**. |
| **Web Browsing** | ❌ NO | ❌ NO | N/A | None |
| **App Info and Performance** (Crash logs, Diagnostics) | 🟢 YES (Opt-in via Google Play Services / Vitals) | ❌ NO | Ephemeral | Analytics & App Performance (Android Vitals) |
| **Device or other IDs** (Advertising ID, IMEI, MAC) | ❌ NO | ❌ NO | N/A | We do NOT use Advertising IDs (zero ad SDKs installed). |

---

## 3. Financial Features & Loan Policy Declaration
* **Does your app facilitate personal loans, short-term lending, or banking deposits?**
  * **Answer**: **NO**.
* **Financial Services Category Declaration**:
  * Select: **Financial Information / Macroeconomic Research**.
  * Explicit note to reviewer: *"GraphiQuestor provides institutional macroeconomic data and central bank statistical releases. It does not execute trades, offer brokerage services, hold customer deposits, or facilitate loans."*

---

## 4. Ads Declaration
* **Does your app contain ads?**
  * **Answer**: **NO**. (GraphiQuestor is 100% ad-free; zero Google Mobile Ads or third-party ad networks).
