# Walk The World v0.2 Game Design

Last updated: 2026-05-01

## Identity

v0.2 keeps the v0.1 walking loop and adds the first crew systems.

The player is no longer only watching distance grow. They are building a walking crew, keeping that crew happy, using early boosts, and collecting the first cosmetics that matter to gameplay without turning cosmetics into raw DPS winners.

## Verified v0.1 Baseline

v0.1 is verified as complete for:

- Distance Traveled, DPS, and DPT
- tapping and passive progress
- generator, tap, and offline upgrades
- WalkerBucks-settled upgrade spending
- queued WalkerBucks rewards instead of local spendable WB
- capped offline progress
- simple milestones
- starter scenery progression

Fresh verification before v0.2 implementation:

```bash
npm run build
npm test
npm run smoke:local
```

## v0.2 Feature Boundary

In scope:

- followers in the default shop
- follower recruit chance
- follower leave chance
- global crew morale
- morale states: Happy, Neutral, Annoyed, Mad
- cosmetics that improve morale or reduce leave chance
- early boost/consumable item offers
- first visible achievement panel
- expanded scenery beats using existing assets

Still out of scope:

- region-specific event systems
- Journey Reset / prestige
- marketplace and peer trading depth
- crafting
- guilds or complex social systems
- local WalkerBucks wallet logic

## Follower Rules

Followers add idle distance, but they are unstable.

Each follower type has:

- DPS contribution
- recruit chance per minute
- leave chance per minute
- morale sensitivity
- rarity
- personality flavor

Followers can recruit more followers when morale is healthy. Followers can leave when morale is low or the crew gets crowded.

The more followers the player has, the harder the crew is to stabilize.

## Cosmetics Rules

Cosmetics are utility and identity items for follower stability.

Current v0.2 cosmetic effects:

- follower morale bonus
- follower leave chance reduction
- fallback style-only utility for cosmetics without a mapped stability effect

Cosmetics should not become the strongest raw DPS path. Their job is to protect the follower system.

## Boost Rules

Boosts are represented by early consumable inventory items purchased through the WalkerBucks-settled item shop.

Current usable boost examples:

- Aura Battery: temporary tap multiplier
- Lucky Shoelaces: temporary drop-rate boost
- Detour Token: temporary event-reward boost
- Questionable Trail Mix and Touch Grass Token: queued WalkerBucks reward consumables

Queued WalkerBucks rewards are pending settlement metadata, not spendable local WB.

## Scenery

v0.2 expands the active route with existing background assets and broad mood labels:

- Starting Room
- Suburb
- Downtown / Skyline
- Night City
- Countryside Road
- Forest Road
- Desert Highway
- Canyon Rim
- Mountain Pass
- Waterfront Walk
- Rainy City
- Old Town
- Neon City

This keeps movement visible without blocking on perfect location-specific art.

## WalkerBucks Rule

Distance is progress.

WalkerBucks are purchasing power.

Followers, cosmetics, boosts, and upgrades are the conversion layer between WalkerBucks and progress. No client save, browser state, Supabase game-save row, or WTW-owned table creates spendable WB.

## Next Version

v0.3 should focus on regions and events:

- region-specific shop theming
- region-specific followers and cosmetics
- weather/events
- daily/weekly walking events
- expanded active-play bonuses
- shop refreshes
