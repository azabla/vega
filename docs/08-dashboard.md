# 08 — Owner dashboard

Roadmap step 2 (see [00](00-product-vision.md)). Users can now sign up, log in and edit their whole portfolio from a phone, without the Django admin. The dashboard is frontend only and uses the existing `/api/auth/` ([03](03-auth.md)) and `/api/me/` ([04](04-multi-tenancy.md)) endpoints. The backend didn't change.

## Routes

| Path | Page |
|------|------|
| `/login`, `/register` | Email + password. Signed-in users are redirected to `?next=` or `/dashboard`. |
| `/dashboard` | Overview: public link (open / copy), a 7-step "finish your profile" checklist, counts |
| `/dashboard/profile` | Name, headline, bio, photo, contact links, resume |
| `/dashboard/about` | About section + services |
| `/dashboard/skills` | Categories, then skills (category, years of experience) |
| `/dashboard/projects` | Project list. Each opens `/dashboard/projects/:id`, the case-study editor: basics, features, challenges, lessons, gallery, architecture |
| `/dashboard/experience`, `education`, `certificates`, `languages` | Lists with add / edit / delete. Experience and certificates link skills as evidence. |
| `/dashboard/messages` | Contact-form messages: reply by email, delete |
| `/dashboard/account` | Username and name, password change |

`/dashboard/*` is behind `RequireAuth`. Anonymous visitors go to `/login?next=<page>`, and `next` only accepts same-site paths. The dashboard is a lazy-loaded chunk, so portfolio visitors don't download it.

## Auth in the browser

| Piece | File |
|-------|------|
| Access token in memory, refresh token in `localStorage` (`vega.refresh`) | `src/auth/tokens.js` |
| `Authorization: Bearer` on every request. On a `401`: refresh once, then retry. | `src/api/axios.js` |
| `AuthProvider` / `useAuth()`: restores the session on load, `login`, `register`, `logout` | `src/auth/AuthProvider.jsx`, `src/auth/context.js` |
| `RequireAuth`, `GuestOnly` | `src/auth/guards.jsx` |

Refresh tokens rotate and the old one is blacklisted, so `refreshTokens()` shares a single in-flight request between all callers. Two parallel refreshes would otherwise log the user out. A rejected refresh token ends the session. A network error doesn't.

## How the forms work

Each section is described as data in `src/dashboard/fields.js`, using the field names from `manage_serializers.py`. Generic components render the sections:

| Component | Job |
|-----------|-----|
| `FormFields` | Renders text, textarea, number, date, select, checkbox, `multiselect` (skill chips) and `image`/`file` (preview, replace, remove) |
| `RecordForm` | Holds the values, saves, and shows the API's `400` errors next to each field |
| `ResourceManager` | List + add/edit modal + delete confirmation for one collection (`/me/skills/`, ...) |
| `ObjectForm` | Single objects: `/me/profile/`, `/me/about/`, one project |

`saveRecord` (`src/dashboard/lib/records.js`) handles files. JSON can't carry files, and multipart can't carry `null` or an empty list. So:
- **Update:** `PATCH` JSON (removing a file sends `null`), then a second multipart `PATCH` with only the newly picked files.
- **Create:** one JSON `POST`, or one multipart `POST` if there are files (a gallery image is required).

Blank optional dates and numbers are sent as `null`.

After any save, the public portfolio's in-memory cache is cleared (`clearPortfolioCache`), so `/u/<username>` shows the change straight away.

**Mobile first:** 44px touch targets, 16px inputs (so iOS doesn't zoom), forms open full screen on phones, a slide-in menu, and Save buttons that stay in view on long forms.

## Adding a field

1. Add it to the model and to the `My…Serializer`'s `fields`.
2. Add one entry to the matching list in `src/dashboard/fields.js`. Nothing else is needed.

## Running it

```bash
docker compose up --build        # then open http://localhost:5173/register
```

On the VPS, set `REGISTRATION_OPEN=false` in `.env.prod` after creating your own account. `/login` still works.

## Not included yet

- Drag-and-drop reordering (use "Display order" numbers)
- Unsaved-changes warning when a form is closed
- Changing the login email, password reset by email
- Automated frontend tests. The flow was checked end to end with Playwright: register, edit each section, uploads, deletes, token refresh, logout.
