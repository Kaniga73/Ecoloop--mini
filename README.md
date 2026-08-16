<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# EcoLoop Web Application

This repository contains the EcoLoop frontend and authentication service.

## Tech Stack
- **Frontend**: React 19, Vite, TailwindCSS
- **Backend / Authentication**: Supabase (Auth, Database, RLS)
- **Language**: TypeScript
- **Icons / Animation**: Lucide React, Motion

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Copy `.env.example` to `.env` and fill in the necessary keys.
   ```bash
   cp .env.example .env
   ```
   You will need to provide:
   - `GEMINI_API_KEY`: Your Gemini API key.
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Project Anon Key.

3. Run the application:
   ```bash
   npm run dev
   ```
   This will start both the Vite development server and the backend express server concurrently.

## Supabase Configuration & OTP Setup

1. **Database Schema Setup**
   - Go to your Supabase Dashboard.
   - Navigate to the **SQL Editor** tab.
   - Copy the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it to create the `user_profiles` table, its types, policies, and triggers.

2. **OTP for User Signups**
   - In your Supabase Dashboard, navigate to **Authentication** > **Providers** > **Email**.
   - Make sure **Confirm email** is toggled ON.
   - To use OTPs (One-Time Passwords) instead of magic links for signup:
     - Toggle ON **Enable Secure Email Change**.
     - In your project's Auth settings, ensure that email confirmations send OTPs (this is typically standard when confirming via `verifyOtp` API, as configured in the frontend code).
   - Once configured, users will receive a 6-digit code during signup which they can enter into the UI to verify their account.
