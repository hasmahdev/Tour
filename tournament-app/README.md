# Tournament Progress App

This is a lightweight application for tracking tournament progress, built with a Vite (React + TypeScript) frontend and a Supabase backend.

## Project Overview

The app features a sidebar UI and dialog-based CRUD operations for managing tournaments, matches, and users. It includes role-based access control for developers, admins, and users, with a custom password-only (username + password) authentication system handled by Supabase Edge Functions.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- A Supabase account

### 1. Supabase Setup

1.  **Create a Supabase Project:** Go to [app.supabase.com](https://app.supabase.com) and create a new project.
2.  **Get Project Credentials:** In your project's dashboard, navigate to **Project Settings > API**. You will need the **Project URL** and the `anon` **public** key.
3.  **Get Service Role Key:** You will also need the `service_role` key for deploying Edge Functions. **Treat this key like a password and never expose it on the client-side.**
4.  **Database Setup:** Navigate to the **SQL Editor** in your Supabase project and execute the entire contents of the `db.sql` file from the root of this repository. This will create all the necessary tables, functions, and RLS policies.
5.  **Create Storage Bucket:** Go to the **Storage** section and create a new public bucket named `tournament-photos`.

### 2. Frontend Setup

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd tournament-app
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Create Environment File:**
    Create a `.env` file in the `tournament-app` directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_PUBLIC_KEY
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

### 3. Deploying Edge Functions

The custom authentication requires Supabase Edge Functions.

1.  **Install Supabase CLI:**
    ```bash
    npm i -g supabase
    ```

2.  **Login to Supabase:**
    ```bash
    supabase login
    ```

3.  **Link Your Project:**
    In the root of the repository, run:
    ```bash
    supabase link --project-ref YOUR_PROJECT_ID
    ```
    You can find your Project ID in the URL of your Supabase dashboard or in the Project Settings.

4.  **Set Function Secrets:**
    Deploying the Edge Functions requires the `SERVICE_ROLE_KEY`. Set it as a secret:
    ```bash
    supabase secrets set --env-file ./supabase/functions/.env
    ```
    You will need to create a file at `supabase/functions/.env` with the following content:
    ```
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```

5.  **Deploy the Functions:**
    ```bash
    supabase functions deploy login
    supabase functions deploy create-user
    ```
