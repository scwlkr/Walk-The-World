# UI Layout Guidelines

Walk The World uses a mobile-first layout. The game view is not a free-for-all of fixed-position cards; each floating element must live in a reserved zone and respect the shared safe-area tokens.

## Layout Tokens

Global CSS tokens live in `src/styles/global.css`.

- `--safe-top`: `env(safe-area-inset-top)` plus edge padding.
- `--safe-right`: `env(safe-area-inset-right)` plus edge padding.
- `--safe-bottom`: `env(safe-area-inset-bottom)` plus edge padding.
- `--safe-left`: `env(safe-area-inset-left)` plus edge padding.
- `--hud-top-offset`: top HUD anchor.
- `--side-button-offset`: right action rail anchor.
- `--bottom-controls-offset`: bottom WALK button anchor.
- `--hud-zone-height`: reserved top HUD height.
- `--right-rail-width`: reserved width for the right action rail.
- `--walk-button-zone-height`: reserved bottom WALK button height.
- `--bottom-location-zone-height`: reserved bottom-left location plaque height.
- `--notification-zone-gap`: spacing between the HUD and notifications.

Do not hard-code edge offsets for fixed UI. Use these tokens.

## Reserved Screen Zones

- Top HUD zone: route, wallet, progress, quests, journey, and active boost status. It starts at `--hud-top-offset`.
- Right action button rail zone: shop, quests, stats, and settings controls. It starts below the HUD zone and is inset by `--side-button-offset`.
- Main gameplay/tap zone: the canvas area where the Walker, route pickups, random events, and tap feedback remain visible and tappable.
- Notification zone: temporary cards and toasts only. It starts below the HUD zone, ends above the WALK button zone, and leaves space for the right action rail.
- Bottom controls zone: the WALK button. It is anchored by `--bottom-controls-offset`.
- Bottom-left location plaque zone: the canvas location plaque. Floating DOM notifications must not render over this area.

## Notification Rules

All temporary UI messages must go through `NotificationCenter`.

Current notification inputs:

- route pickup and route encounter cards
- random event cards
- offline earnings
- reward and item pickup toasts from `recentRewards`
- quest, milestone, achievement, system, reward, error, and hint text from `ui.toast`

Rules:

- Show only one large card at a time.
- Large card priority is route encounter, then random event, then offline earnings.
- Show no more than two small toasts at a time.
- New important cards wait behind the current large card instead of rendering beside it.
- Expired or dismissed messages reveal the next available large card.
- Temporary messages must not be rendered directly by feature components as their own fixed-position popup.
- Feature code may set state for the message source, but display belongs to `NotificationCenter`.

## Safe-Area Rules

- The viewport meta tag must include `viewport-fit=cover`.
- Every fixed or absolute gameplay UI layer must use the shared safe-area tokens.
- Keep at least 12-16px of padding after safe-area inset adjustment.
- The HUD must stay below `--safe-top`.
- Right-side controls must stay inside `--safe-right`.
- The WALK button must stay above `--safe-bottom`.
- Overlay sheets must include safe-area padding on all four sides.
- No fixed element should touch the physical screen edge.

## Z-Index Rules

- Canvas: `z-index: 1`.
- Tap feedback: `z-index: 28`.
- HUD: `z-index: 30`.
- Notification zone: `z-index: 34`.
- WALK button: `z-index: 35`.
- Right action rail: `z-index: 36`.
- Modal and overlay sheets: `z-index: 40`.

Do not add a new z-index tier unless the existing zones cannot express the required layering.

## Placement Examples

- HUD or route progress: `.game-hud`, inside the top HUD zone.
- Shop, quests, stats, settings buttons: `.bottom-controls`, inside the right action rail zone.
- WALK control: `.walk-button-wrap`, inside the bottom controls zone.
- Route pickup, random event, offline earnings: `NotificationCenter` large slot.
- Reward, item pickup, error, system hint, quest reminder: `NotificationCenter` toast stack.
- Full overlay panels: `GameOverlaySheet`, inside `.overlay-backdrop`.

## Developer Checklist

Before merging UI changes:

- Test on a narrow mobile viewport.
- Test with iPhone rounded corners or safe area.
- Trigger route pickup, quest reminder, and offline reward at the same time.
- Confirm notifications queue instead of overlap.
- Confirm the HUD is not cut off.
- Confirm right-side buttons are not cut off.
- Confirm the WALK button is not cut off.
- Confirm the Walker and tap area remain visible.
- Confirm no new fixed-position UI bypasses the notification manager.
