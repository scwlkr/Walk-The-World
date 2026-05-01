# UI Layout Guidelines

Last updated: 2026-05-01

## Strategy

Walk The World uses a mobile-first game shell. Desktop should render the same composition in a centered mobile-width frame instead of inventing a separate desktop HUD.

Desktop media queries must position HUD, notifications, and action controls relative to the mobile game shell, not the full browser viewport. The shell clips overflow, so viewport-based rail offsets can hide controls on desktop.

## Safe Areas

- `index.html` must keep `viewport-fit=cover`.
- Fixed UI uses `--safe-top`, `--safe-right`, `--safe-bottom`, and `--safe-left`.
- No fixed control should sit directly on the viewport edge.
- The WALK button owns the bottom safe-area zone.

## Z-Index Order

- Canvas: `1`
- Tap feedback: `28`
- HUD: `30`
- Notifications and encounters: `34`
- WALK button: `35`
- Right action rail: `36`
- Modal sheets: `40`

## HUD

- Keep WB, DT, and DPS as the only primary stat row.
- Route progress belongs directly below the primary stats.
- Secondary pills should be short, single-line, and visually quieter than the primary row.
- Do not add new fixed HUD blocks without updating the reserved HUD zone height.

## Controls

- Touch targets should be at least `44px`.
- The WALK button stays visible and reachable above the bottom safe area.
- The right action rail starts below the HUD reserved zone and must not overlap the player, notifications, or WALK button.

## Modals

- Sheets open from the bottom and may use nearly the full screen on mobile.
- Modal headers stay visible while content scrolls.
- Modal body scrolls internally.
- Close controls must remain visible.
- Text must wrap inside buttons, cards, and status grids.

## Visual Tone

- Keep the pixel-art world expressive.
- Keep UI chrome quieter: one-pixel borders, soft shadows, restrained accents, and no heavy text shadows.
- Cards are for repeated items, panels, and modal content only. Do not nest decorative cards inside other decorative cards.

## Pre-Merge Check

- iPhone-sized viewport: HUD readable, WALK visible, no rail/HUD/player collision.
- Desktop viewport: centered mobile frame looks intentional.
- Settings modal: close button visible, content scrolls, no clipped controls.
- Shop modal: every purchasable item card has visible artwork.
- Notifications: no overlap with HUD, right rail, or WALK button.
