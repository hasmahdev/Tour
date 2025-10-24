# Deploying to Cloudflare Pages

This guide provides instructions for deploying the Tournament App to [Cloudflare Pages](https://pages.cloudflare.com/).

## 1. Project Setup in Cloudflare

1.  **Log in to Cloudflare:** Go to your Cloudflare dashboard.
2.  **Navigate to Pages:** In the left-hand sidebar, select **Workers & Pages**.
3.  **Create a New Application:** Click **Create application**, then select the **Pages** tab.
4.  **Connect to Git:** Connect your GitHub or GitLab account where the repository is hosted.
5.  **Select Repository:** Choose the repository for this project.

## 2. Build and Deployment Settings

After selecting the repository, you will be prompted to configure your build settings. Use the following configuration:

-   **Production branch:** `main` (or your primary branch)
-   **Framework preset:** `Vite`
-   **Build command:** `npm run build`
-   **Build output directory:** `dist`
-   **Root directory:** `tournament-app`

![Cloudflare Build Settings](https://i.imgur.com/example-image.png) <!-- It's helpful to add a screenshot here if possible -->

## 3. Environment Variables

For the application to connect to your Supabase backend, you need to add environment variables in the Cloudflare Pages settings.

1.  Go to your project's **Settings > Environment variables**.
2.  Add the following variables under **Production**:

| Variable Name          | Value                               |
| ---------------------- | ----------------------------------- |
| `VITE_SUPABASE_URL`    | Your Supabase Project URL           |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase `anon` (public) key |

**Note:** These variables must be prefixed with `VITE_` to be exposed to the client-side code, as configured in Vite.

## 4. Deploy

After configuring the build settings and environment variables, click **Save and Deploy**. Cloudflare Pages will automatically build and deploy your application.

You can monitor the deployment progress in the Cloudflare dashboard. Once the deployment is complete, you will be provided with a unique `.pages.dev` URL where you can access your live application.
