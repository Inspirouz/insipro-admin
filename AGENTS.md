# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

```bash
npm i            # install dependencies
npm run dev      # start dev server at http://localhost:4000
npm run build    # build to dist/
npm run preview  # preview production build at http://localhost:4000
```

There is no test runner configured in this project.

## Environment

The only env var used is `VITE_API_URL` (set in `.env`):

```
VITE_API_URL=https://dev.api.inspiro.uz/api
```

This base URL already includes `/api`. All domain-specific API modules strip or append paths accordingly (e.g., `/admin/projects` becomes `${VITE_API_URL}/admin/projects`). The image base URL is derived by stripping the `/api` suffix and appending `/images`.

## Architecture Overview

This is a React 18 + TypeScript SPA built with Vite. It is an admin panel for the **Inspiro** design inspiration platform (similar to Mobbin).

### Source Layout

There is a notable directory oddity: the project root source (`src/`) contains a nested `src/src/` subdirectory. The actual app code lives in `src/src/`:

- `src/App.tsx` — router (React Router v6), defines all routes
- `src/main.tsx` — entry point, mounts `App`
- `src/components/ui/` — shadcn/ui-style primitive components (Radix UI wrappers)
- `src/src/pages/` — one file per route/page
- `src/src/components/` — shared layout components (`DashboardLayout`, `Sidebar`, `ProtectedRoute`, `PageHeader`, etc.)
- `src/src/lib/types.ts` — core domain types (`App`, `Screen`, `TaxonomyItem`, `Scenario`, `User`, `AuthUser`)
- `src/src/lib/auth.ts` — auth helpers; JWT stored in `localStorage` under key `admin_token`, refresh token under `admin_refresh_token`
- `src/src/lib/api/` — API layer (see below)
- `src/styles/globals.css` — Tailwind v4 `@theme` config with dark palette and lime (`#a3e635`) accent

There is also a `src/src/app/` directory with Next.js-style file structure (`(dashboard)/`, `login/`, etc.) that is not wired up — routing is handled exclusively by `src/App.tsx`.

### API Layer

The API layer has two distinct parts that coexist:

**1. `ApiClient` interface + implementations (`src/src/lib/api/`)**
- `client.ts` — `ApiClient` interface (auth, apps, screens, taxonomy, scenarios, users, upload)
- `mockClient.ts` — in-memory mock implementation with seed data
- `httpClient.ts` — HTTP implementation stub (all methods throw `Not implemented`)
- `index.ts` — exports `apiClient`; currently set to `mockClient`. Swap to `httpClient` when the backend is ready by editing this file.

**2. Domain-specific HTTP modules (the real backend calls)**
Pages import directly from these modules rather than using `apiClient`:
- `projectsApi.ts` — CRUD for apps (`/admin/projects`)
- `adminScreensApi.ts` — CRUD for screens (`/admin/screens`)
- `categoriesApi.ts` — app categories (`/categories`)
- `screensCategoriesApi.ts` — screen categories (`/admin/screens-categories`)
- `scenariosApi.ts` — scenarios (`/admin/scenarios`)
- `scenarioCategoriesApi.ts` — scenario categories (`/admin/scenarios-categories`)
- `tagsApi.ts` — tags/patterns/UI elements (`/admin/tags`)
- `adminUsersApi.ts` — user management (`/admin/users`)
- `executerApi.ts` — admin user management (`/executer`)
- `fileApi.ts` — file upload/delete (`/file`)

All modules handle variable API response shapes (`{ data: [...] }`, `{ items: [...] }`, or bare arrays). A 401 response triggers `handleUnauthorizedStatus()` which clears the token and redirects to `/login`.

### Authentication Flow

Login posts to `/executer/login` with `{ username, password }`. On success, `access_token` and `refresh_token` are stored in `localStorage`. `ProtectedRoute` checks `isAuthenticated()` (presence of `admin_token` in localStorage) on every navigation and redirects to `/login` if absent.

### Routing & Layout

All authenticated routes are nested under `<ProtectedRoute><DashboardLayout /></ProtectedRoute>`. `DashboardLayout` renders the `Sidebar` + `<Outlet />`. The sidebar navigation links are: Apps (`/apps`), Categories (`/categories`), Users (`/users`), Admins (`/admins`). Screens and Settings routes exist in `App.tsx` but are commented out in the sidebar.

### Styling

Tailwind CSS v4 with a Mobbin-inspired dark theme. Custom CSS variables are defined in `src/styles/globals.css` under `@theme` and include semantic aliases like `bg-bg-primary`, `text-text-secondary`, `bg-lime`, `shadow-soft`. Use these semantic classes (not raw hex values) when adding new UI.
