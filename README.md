# Personal Web Page

A modern personal web space built with Next.js and Supabase.

## Supabase Setup

1. **Create Project**
   - Go to https://supabase.com and sign up
   - Create new project
   - Choose region closest to you
   - Set a strong password
   - Wait for project to initialize

2. **Run SQL Schema**
   - Go to SQL Editor in Supabase dashboard
   - Create new query
   - Copy entire content from `schema.sql` file
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion

3. **Create Storage Buckets**
   - Go to Storage in Supabase dashboard
   - Create new bucket: `feed-media` (public)
   - Create new bucket: `file-manager` (public)
   - Create new bucket: `browser-images` (public)
   
   For each bucket, click settings and set:
   - **feed-media**: 10 MB limit, MIME types: `image/jpeg, image/png, image/gif, image/webp, video/mp4, video/webm, video/quicktime`
   - **file-manager**: 15 MB limit, MIME types: `image/*, video/*, application/pdf, text/*, application/msword, application/vnd.openxmlformats-officedocument.*, application/zip`
   - **browser-images**: 5 MB limit, MIME types: `image/jpeg, image/png, image/gif, image/webp, image/svg+xml`

4. **Get API Keys**
   - Go to Settings → API in Supabase dashboard
   - Copy `Project URL` → use as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon` `public` key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → use as `SUPABASE_SERVICE_ROLE_KEY`
   
   Note: The "anon public" key is also called "publishable key" in some Supabase docs

5. **Setup Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in the three Supabase keys from step 4
   - Generate admin password hash:
     ```bash
     node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 12).then(console.log)"
     ```
   - Add hash to `.env.local` as `ADMIN_PASSWORD_HASH`
   - Generate encryption key:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Add to `.env.local` as `ENCRYPTION_KEY`

6. **Install & Run**
   ```bash
   npm install
   npm run dev
   ```

7. **PWA Setup** (Optional)
   - Create `icon-192.png` and `icon-512.png` in `/public/` (use https://realfavicongenerator.net/)
   - Add `notification.mp3` in `/public/` (from https://notificationsounds.com/)
   - Login at `/a` with your password
   - Click 🔔 icon to enable notifications

## Features

- Public chat with media embeds (YouTube, Giphy, images, videos)
- Private messaging between users and admin (encrypted)
- Reply to messages with thread preview
- User sessions for persistent identity
- Browser link collection with tags
- Feed with masonry grid (file upload or URL)
- File manager with folders
- Admin authentication
- Dark/light mode
- Timezone display
- Apple Music player
- Touch swipe navigation
- IP-based rate limiting
- Image compression to WebP
- **PWA Support** - Install as native app
- **Push Notifications** - Get notified of new content
- **Custom notification sound** - Add your own sound
- **Offline support** - Cached pages work offline
