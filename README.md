# vibesql.online

Product site, docs, and quickstart for [VibeSQL](https://vibesql.online) -- the PostgreSQL-native database platform.

## What's on the site

- **Docs** (`public/docs.html`) -- API reference, protocol details, and usage guides
- **Quickstart** (`public/quickstart.html`) -- get up and running with VibeSQL in minutes
- **Changelog** (`public/changelog.html`) -- release history and what's new
- **About** (`public/about.html`) -- project background and team
- **Registration** (`public/session.html`) -- account sign-up flow
- **Hackathon** (`app/hackathon/`) -- Next.js-rendered hackathon event page

## Tech stack

- **Next.js 15** with static export (`output: 'export'`)
- **React 19** + **TypeScript**
- **Tailwind CSS 3** for styling
- Static HTML pages served from `public/`
- Built output in `out/` deployed to Azure Static Web Apps

## Run locally

```bash
npm install
npm run dev
```

This builds the static site and serves it at `http://localhost:3800`.

For a production-style build:

```bash
npm run build    # outputs to out/
```

## Project structure

```
app/                 # Next.js app router pages
  hackathon/         # Hackathon event page
  layout.tsx         # Root layout
  globals.css        # Global styles
components/          # React components (Hero, Navigation, FAQ, etc.)
lib/                 # Shared libraries (VibeSQL client)
public/              # Static HTML pages, assets, icons
  docs.html          # Documentation
  quickstart.html    # Quickstart guide
  changelog.html     # Changelog
  about.html         # About page
  session.html       # Registration
next.config.ts       # Next.js config (static export)
tailwind.config.ts   # Tailwind configuration
```

## Contributing

- **Content pages** live in `public/` as standalone HTML files
- **React components** live in `components/` (Navigation, Hero, Footer, etc.)
- **Next.js pages** use the App Router in `app/`
- Run `npm run lint` before submitting changes

## Deployment

The site is deployed as an **Azure Static Web App** via Azure DevOps Pipelines.

### 1. Create Azure Static Web App (one-time)

1. Go to https://portal.azure.com
2. Create Static Web App
   - Name: `vibesql-online`
   - Region: West US 2
   - Plan: **Free**
   - Deployment: **Other**
3. After creation, go to **Settings > Configuration**
4. Copy the **Deployment token**

### 2. Configure DevOps Pipeline

**Add deployment token:**
1. Azure DevOps > Vibe SQL Microserver project
2. Pipelines > Library
3. Create variable group: `vibesql-website-vars`
4. Add variable: `deployment_token` (mark as secret)
5. Paste the token from step 1

**Create pipeline:**
1. Pipelines > New Pipeline
2. Select: Azure Repos Git
3. Repository: Vibe SQL Microserver
4. Existing YAML: `/azure-pipelines-website.yml`
5. Save and Run

### 3. Get Deployment URL

After pipeline completes:
- Static Web App URL: `https://vibesql-online.azurestaticapps.net`
- This is your CNAME target for DNS

### 4. Configure DNS

Point your domain to the Static Web App:
```
CNAME  vibesql.online  ->  vibesql-online.azurestaticapps.net
```

Then add custom domain in Azure Static Web App settings.

## License

MIT
