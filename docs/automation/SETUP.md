# GraphiQuestor Newsletter Automation Setup

This guide walks you through setting up the automated monthly newsletter generation.

## Prerequisites
1. **Google Account**: Access to Google Drive / Apps Script.
2. **Supabase Credentials**:
    - Project URL: `https://debdriyzfcwvgrhzzzre.supabase.co`
    - Anon Key: (Found in Supabase Dashboard > Project Settings > API)
3. **Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/).

## Setup Instructions

### 1. Create Google Apps Script
1.  Go to [script.google.com](https://script.google.com/home).
2.  Click **New Project**.
3.  Rename the project to **"GraphiQuestor Automation"**.
4.  Copy the code from `docs/automation/graphiquestor_newsletter.gs` in this repository.
5.  Paste it into the `Code.gs` file in the script editor, replacing any existing code.

### 2. Set Script Properties
To keep your keys secure, we use Script Properties.
1.  In the Apps Script editor, click on the **Project Settings** (gear icon) in the left sidebar.
2.  Scroll down to **Script Properties**.
3.  Click **Add script property** for each of the following:
    - `SUPABASE_URL`: `https://debdriyzfcwvgrhzzzre.supabase.co`
    - `SUPABASE_ANON_KEY`: (Paste your Supabase Anon Key)
    - `GEMINI_API_KEY`: (Paste your Gemini API Key)
    - `USER_EMAIL`: (Your email address to receive notifications)
4.  Click **Save script properties**.

### 3. Test the Script
1.  Return to the **Editor** (code icon).
2.  Select the `generateNewsletter` function from the dropdown in the toolbar.
3.  Click **Run**.
4.  Grant the necessary permissions (Drive, External Services, Email).
5.  Check your email for the "Newsletter Generated" notification and link to the Google Doc.

### 4. Automate (Monthly Trigger)
1.  Click on **Triggers** (alarm clock icon) in the left sidebar.
2.  Click **+ Add Trigger**.
3.  Configure:
    - Function: `generateNewsletter`
    - Event Source: **Time-driven**
    - Type: **Month timer**
    - Select day: **1st**
    - Time of day: **9am to 10am** (or your preference)
4.  Click **Save**.

The system will now automatically generate a macro newsletter draft for you on the 1st of every month!
