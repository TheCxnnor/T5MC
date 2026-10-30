# 🚀 T5 Mission Control

A progression tracker and calculator for T5, covering Moon, Mars and Sun.

**Use the site: [t5mc.space](https://t5mc.space)**

Originally built as a spreadsheet, T5 Mission Control brings progression tracking, material totals and calculators together in one website.

## Features

### Progression tracking
- Track helmets, armor, drills, cores, talismans and miscellaneous upgrades.
- View completion percentages for Moon, Mars and Sun.
- See remaining material costs as you complete upgrades.

### Upgrade recommendations
- Find your next quickest eligible upgrade and what to mine.
- Estimate the time needed for mining drops, coins and compaction.
- Account for Power Rank, Ascension, prerequisites and Magma Storage.
- Optionally include refinery and Haste upgrades in recommendations.
- Refinery and Haste upgrades always count towards planet completion.

### Mining Profit Calculator
- Compare mining sources and potion setups.
- Include supported pet effects, refinery levels and Haste.
- View estimated profit and mining drops.

### PvE Calculator
- Compare supported weapons, mobs and pet setups.
- Calculate damage, hits to kill, time to kill and kills per hour.
- Estimate Ash, drops and average drop times.

### Crafting totals
- View remaining materials and currencies across your progression.
- See core, compacted and plasma recipe breakdowns.
- Include the raw ingredients needed for crafted materials.
- View estimated compaction times.

### Accounts and cloud saves
- Optional Discord sign-in.
- Automatic cloud saving.
- Automatic cloud restore when signing in.
- Separate trackers for your main Minecraft account and alts.
- Switch Minecraft profiles from the account menu.
- Display Minecraft skin faces alongside usernames.
- Use your Main Minecraft username as your site username.

## Saving your progress

Guest progress is stored in your browser.

Sign in with Discord to save progress across devices. Wait for **“Saved to cloud”** before closing the site.

Signing in loads your existing cloud save and replaces that browser’s local tracker progress. If you do not have a cloud save yet, your local progress is retained for import.

Minecraft profiles are separate trackers within your site account. Adding a username does not connect to or verify ownership of a Minecraft account.

## Privacy and account access

- Discord handles authentication. T5 Mission Control never receives your Discord password.
- The site does not ask for Microsoft or Minecraft login credentials.
- Other players cannot access your cloud saves.
- Site admins can view cloud-saved trackers through a read-only support viewer.
- Signing in is optional.

## Running locally

### Requirements
- A Node.js version supported by the installed Next.js release
- npm
- A Supabase project if you want account and cloud-save functionality

### Installation

Clone the repository and install dependencies:

    git clone https://github.com/TheCxnnor/T5MC.git
    cd T5MC
    npm install

Create `.env.local` in the project root:

    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

Keep `.env.local` out of Git. Never place a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

Start the development server:

    npm run dev

Open [localhost:3000](http://localhost:3000).

### Supabase setup

For account functionality, review and run the SQL setup files in this order:

1. `supabase/accounts.sql`
2. `supabase/admin.sql`
3. `supabase/main-username.sql`

Enable the Discord authentication provider in Supabase and configure its OAuth credentials.

Add this local redirect URL in **Authentication → URL Configuration**:

    http://localhost:3000/auth/callback

For deployment, set your production Site URL and add its `/auth/callback` URL to the allowed redirects.

Admin access is assigned separately through the database. Normal users cannot grant themselves admin access.

### Production build

    npm run build
    npm run start

## Built with

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

## Feedback and contributions

Bug reports, suggestions and contributions are welcome.

Please include the affected page, your relevant settings and the steps needed to reproduce an issue. Do not include passwords, authentication tokens or private account information.

## Estimates

Calculator results are estimates based on the configured inputs and game data. Random drops and changes to game mechanics can affect actual results.
