# EcoLoop Web Application

This repository contains the EcoLoop frontend and authentication service.

## Tech Stack
- **Frontend**: React 19, Vite, TailwindCSS
- **Backend / Authentication**: Express, Supabase (Auth, Database, RLS)
- **AI Service**: Python FastAPI, PyTorch, Hugging Face Transformers (OpenAI CLIP ViT-B/32)
- **Language**: TypeScript, Python
- **Icons / Animation**: Lucide React, Motion

---

## Running the Services

### 1. Python AI Service (CLIP Waste Classification)

The AI service runs locally using FastAPI and the open-source OpenAI CLIP model (`openai/clip-vit-base-patch32`) for zero-shot image classification, hazard determination, and human rejection.

> **Note:** On the very first run, Hugging Face will automatically download the CLIP model weights (~600 MB) once. Subsequent runs use the cached model directly.

1. Navigate to the `ai-service` directory:
   ```bash
   cd ai-service
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The AI service will be available at `http://localhost:8000`.

---

### 2. Backend & Frontend Application

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
   - `AI_SERVICE_URL`: URL of the Python AI service (default: `http://localhost:8000`).
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Project Anon Key.

3. Run the application:
   ```bash
   npm run dev
   ```
   This starts both the Vite frontend development server and the Express backend API server concurrently.

---

## Supabase Configuration & OTP Setup

1. **Database Schema Setup**
   - Go to your Supabase Dashboard.
   - Navigate to the **SQL Editor** tab.
   - Copy the contents of [`schema.sql`](schema.sql) and run it to create the `user_profiles` table, its types, policies, and triggers.

2. **OTP for User Signups**
   - In your Supabase Dashboard, navigate to **Authentication** > **Providers** > **Email**.
   - Make sure **Confirm email** is toggled ON.
   - To use OTPs (One-Time Passwords) instead of magic links for signup:
     - Toggle ON **Enable Secure Email Change**.
     - In your project's Auth settings, ensure that email confirmations send OTPs (this is typically standard when confirming via `verifyOtp` API, as configured in the frontend code).
   - Once configured, users will receive a 6-digit code during signup which they can enter into the UI to verify their account.
