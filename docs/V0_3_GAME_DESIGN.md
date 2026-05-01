# Walk The World v0.3 Game Design

Last updated: 2026-05-01

## Identity

v0.3 keeps the v0.2 walking, followers, morale, cosmetics, boosts, and WalkerBucks-settled shop loop. The new goal is to make the world feel larger.

The player should now understand:

```text
I am in a region.
The region changes my bonuses, shop, followers, and events.
I want to reach the next region.
```

## Verified Baseline

v0.2 is verified as complete for:

- Distance Traveled, DPS, and DPT
- tapping and passive progress
- upgrades, followers, morale, cosmetics, boosts, and achievements
- WalkerBucks-settled spending and queued rewards
- expanded starter scenery
- guest play without Supabase or WalkerBucks bridge configuration

## v0.3 Feature Boundary

In scope:

- 10-15 broad Earth regions using existing background assets
- region-specific shop refreshes
- region-specific followers
- region-specific cosmetic and gear highlights
- weather/random events in the default player path
- route encounters in the default player path
- daily and weekly walking event goals
- active tap combo and perfect-step bonuses
- achievement expansion for regions, events, and active play

Still out of scope:

- Journey Reset / prestige as the main player path
- peer marketplace depth
- crafting
- complex social systems
- local WalkerBucks wallet logic

## Region Rule

Regions are a gameplay layer over the existing route.

Regions can:

- change the visible region name
- change the current background scene
- add small DPS, DPT, event, recruit, or stability bonuses
- highlight regional shop offers
- unlock regional followers
- influence which events can spawn

Regions must not:

- create spendable WalkerBucks
- require perfect real-world location art
- block guest/local play

## Event Rule

Events are short-lived interruptions that make the route feel alive.

Current v0.3 event examples:

- Perfect Weather: temporary DPS boost
- Rainy Day: temporary follower stability boost
- Blister Incident: temporary tap reduction
- Parade: temporary follower recruiting boost
- Walking Playlist: active-play boost
- Double Step Weekend: weekly-style progress burst

Events may queue WalkerBucks rewards only through the existing pending grant path.

## Active Play Rule

Quick taps build a combo. Every tenth combo tap is a perfect step.

The combo gives active players a small DPT multiplier without replacing idle progression.

## WalkerBucks Rule

Distance is progress.

WalkerBucks are purchasing power.

v0.3 keeps the same economy boundary: WTW can calculate gameplay progress, queue pending reward/spend metadata, and reserve bridge-reported spendable WB for optimistic purchases, but no local save, browser state, Supabase game-save row, or WTW-owned table creates spendable WB.

## Next Version

v0.4 should focus on Journey Reset / prestige:

- first Journey Reset in the normal player path
- Journey Tokens
- permanent journey upgrades
- reset rules that preserve account, achievements, cosmetics, and WalkerBucks wallet state
- stronger long-term replay goals
