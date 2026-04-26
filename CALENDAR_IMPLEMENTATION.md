# Calendar Tab — Implementation Spec

## Overview

Add a new **Calendar** tab to Bitácora that embeds the user's Google Calendar as a read-only view. No connection to transactions, recurring payments, or any other app data.

## Decisions Log

| Question | Decision |
|---|---|
| Interaction type | Read-only view |
| Calendar scope | All calendars in the user's Google account |
| App data integration | None — pure calendar viewer |
| Authentication | None — Google Calendar iframe embed |
| Display format | Week view |

---

## Implementation

### 1. New Route & Page

- Add a `/calendar` route in `App.tsx`.
- Create `src/pages/CalendarPage.tsx`.
- Add a Calendar entry to the sidebar and mobile bottom nav in `src/components/Sidebar.tsx`.

### 2. CalendarPage Component

The page renders a full-height iframe pointing to the user's Google Calendar embed URL in week view.

The embed URL format is:

```
https://calendar.google.com/calendar/embed?mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=1&src=<encoded-calendar-id>
```

The `src` parameter is the user's Google account email address, URL-encoded. For multiple calendars, append additional `&src=<id>` parameters.

### 3. Settings Integration

Add a **Calendar** section to `SettingsPage.tsx` where the user pastes their Google Calendar embed URL (obtained from Google Calendar → Settings → Integrate calendar → Embed code). Stored in `localStorage` under the key `calendar_embed_url`.

If no URL is configured, `CalendarPage` shows an empty state with instructions on how to get the embed URL from Google Calendar settings.

### 4. Dark Mode

The Google Calendar iframe does not respect the app's dark mode. Two options:

- **Simple:** Wrap the iframe in a container with a white background so it always looks clean regardless of app theme.
- **Advanced (future):** Apply a CSS `invert(1) hue-rotate(180deg)` filter on the iframe element as a dark mode approximation.

Default to the simple approach for now.

### 5. Responsive Layout

- On desktop: iframe takes the full content area minus the sidebar.
- On mobile: iframe takes the full viewport height minus the bottom nav bar.
- Set `width: 100%` and a fixed or `calc`-based height to avoid double scrollbars.

---

## Out of Scope

- Creating, editing, or deleting calendar events.
- Linking calendar events to transactions or recurring payments.
- Google OAuth / API key authentication.
- Custom event rendering outside the iframe.
