# Google Play Store Submission & Approval Master Checklist

Follow this exact end-to-end roadmap to submit GraphiQuestor to the Google Play Console, pass review on first submission, and scale to the #1 ranking.

---

## Phase 1: Google Play Console Account Setup

- [ ] **1.1 Register Google Play Console Account**
  - Go to [play.google.com/console](https://play.google.com/console) and register.
  - Pay the one-time $25 registration fee.
  - Complete Identity Verification (Passport / Driver's License and D-U-N-S number if registering an organization account).
- [ ] **1.2 Create New Application**
  - Click **Create App**.
  - App Name: `GraphiQuestor: Macro Terminal`
  - Default Language: `English (United States)`
  - App or Game: `App`
  - Free or Paid: `Free`
  - Accept Developer Program Policies and US Export Laws.

---

## Phase 2: App Content & Policy Questionnaire (Zero-Strike Guarantee)

Navigate to **Policy and Programs > App Content** and complete each section:

- [ ] **2.1 Privacy Policy**
  - Enter Privacy Policy URL: `https://graphiquestor.com/privacy` (matches [PRIVACY_POLICY.md](PRIVACY_POLICY.md)).
- [ ] **2.2 App Access (Reviewer Credentials)**
  - Select: **All functionality is available without special access**.
  - (GraphiQuestor does not require a login wall for the main macro stream).
- [ ] **2.3 Ads Declaration**
  - Select: **No, my app does not contain ads**.
- [ ] **2.4 Content Rating Questionnaire**
  - Category: `Utility, Productivity, Communication, or Other` (or `Financial`).
  - Answer NO to: Violence, Sexual Content, Offensive Language, Controlled Substances, Gambling.
  - Expected Result: **PEGI 3 / Everyone (ESRB)** rating issued automatically.
- [ ] **2.5 Target Audience and Content**
  - Target Age Group: `18 and over`.
  - Is your app unintentionally appealing to children?: `No`.
- [ ] **2.6 Financial Features Declaration**
  - Does your app provide personal loans?: **No**.
  - Financial feature: Select **Financial Information & Macro Research**.
- [ ] **2.7 Data Safety Form**
  - Complete using the exact answers provided in [DATA_SAFETY.md](DATA_SAFETY.md):
    - No personal data collected or shared.
    - All data encrypted in transit (TLS 1.3).
    - Opt-in app diagnostic / crash telemetry via Google Play.
- [ ] **2.8 Government Apps**
  - Is this an official government app?: **No**.

---

## Phase 3: Store Listing Setup

Navigate to **Grow > Store Presence > Main Store Listing**:

- [ ] **3.1 Copy & Metadata**
  - Paste App Title, Short Description, and Full Description from [LISTING.md](LISTING.md).
- [ ] **3.2 Graphical Assets**
  - Upload App Icon (512 x 512 px PNG).
  - Upload Feature Graphic (1024 x 500 px PNG/JPEG).
  - Upload at least 4 Phone Screenshots (1080 x 2400 px) from [STORE_ASSETS.md](STORE_ASSETS.md).
  - Optional: Upload 7-inch and 10-inch tablet screenshots.

---

## Phase 4: Release Build Generation & Keystore Signing

To generate the production `.aab` (Android App Bundle):

```bash
# 1. Generate release signing key (if not already created)
keytool -genkey -v -keystore release-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias graphiquestor-key

# 2. Build production Android App Bundle (AAB) with R8 optimizations
cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 /opt/homebrew/opt/gradle@8/bin/gradle bundleRelease
```

The compiled release artifact will be located at:
`android/app/build/outputs/bundle/release/app-release.aab`

---

## Phase 5: Closed Testing & Production Rollout

> [!NOTE]
> For personal Google Play developer accounts created after November 2023, Google requires a 14-day closed testing period with at least 20 opted-in testers before production access is unlocked. Organization accounts can apply directly to production.

- [ ] **5.1 Create Closed Testing Track**
  - In Play Console, go to **Testing > Closed testing**.
  - Click **Create track** (e.g. "Alpha Allocators").
  - Upload `app-release.aab`.
  - Create email list of testers (or Google Group).
  - Send opt-in link to testers.
- [ ] **5.2 Maintain Active Testing (14 Days)**
  - Ensure testers keep the app installed and open it periodically.
  - Verify Android Vitals in Play Console:
    - Crash rate: 0.0%
    - ANR rate: 0.0%
- [ ] **5.3 Apply for Production Access**
  - Answer the 20-tester feedback questionnaire in Play Console.
  - Submit for Production Review.
- [ ] **5.4 Launch to Production**
  - Once approved, set rollout to 100%.

---

## Phase 6: Post-Launch Ranking Velocity (Reaching #1)

- [ ] **6.1 Monitor Android Vitals Daily**
  - Check **Quality > Android Vitals > Core Vitals**. Ensure all metrics remain green.
- [ ] **6.2 Drive 5-Star Reviews**
  - The in-app `PlayReviewManager` automatically prompts users who create alerts or pin metrics.
- [ ] **6.3 Weekly Keyword Iterations**
  - Review Google Play Console search acquisition reports to track organic rank for *"Macro Terminal"*, *"Global Liquidity"*, and *"De-Dollarization"*.
