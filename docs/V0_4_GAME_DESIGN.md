# Walk The World v0.4 Game Design

Last updated: 2026-05-01

## Identity

v0.4 turns the verified walking, crew, regions, events, and WalkerBucks-settled shop loop into a replayable idle-game loop.

The player should now understand:

```text
I can complete a major Earth journey.
I can reset that journey.
Resetting clears normal run power, but permanent knowledge stays.
Journey Tokens open better future runs.
```

## Verified Baseline

v0.3 is verified as complete for:

- Distance Traveled, DPS, DPT, tapping, passive progress, and offline progress
- upgrades, followers, morale, cosmetics, boosts, achievements, and milestones
- 15 broad Earth regions with regional bonuses, shop highlights, followers, and events
- route encounters, weather events, daily and weekly walking events
- WalkerBucks-settled spending and queued rewards
- guest play without Supabase or WalkerBucks bridge configuration

## v0.4 Feature Boundary

In scope:

- first Journey Reset in the normal player path
- Journey Tokens earned from completed Earth loops
- permanent Journey Upgrades bought with Journey Tokens
- reset rules that preserve account, achievements, cosmetics, inventory, and WalkerBucks bridge state
- reset rules that clear normal upgrades, followers, active boosts, Earth route distance, and route events
- Moon route unlock after the first Journey Reset
- save migration to v0.4 state

Still out of scope:

- v0.5 rare collections and title depth
- crafting
- peer marketplace depth
- Discord and Telegram reward linking
- WalkerBucks-priced prestige purchases
- Mars and Solar System as normal player-path content

## Journey Reset Rule

Journey Reset is available after one complete Earth loop.

Resetting should:

- return Earth route distance to the start of a new journey
- reset normal generator and tap upgrades
- reset followers and active boosts
- reset current route events and encounter timers
- grant Journey Tokens based on completed Earth loops
- unlock Moon as a new route option
- keep WalkerBucks bridge state intact
- keep achievements, cosmetics, inventory, profile titles, account state, and settings intact

Journey Reset should not:

- create spendable WalkerBucks locally
- erase settled WalkerBucks purchase history
- become a paid skip to the next distance milestone
- unlock v0.5 collection depth early

## Journey Tokens

Journey Tokens are local prestige progress, not WalkerBucks.

They are earned by resetting after major distance goals and spent only on permanent Journey Upgrades. They do not represent a WalkerBucks balance, ledger movement, marketplace item, or transferable economy asset.

## Permanent Upgrades

The first v0.4 permanent upgrades are intentionally small:

- Better Shoes: permanent distance power
- Route Memory: start future journeys with Leave the Couch complete
- Friendly Aura: follower stability
- Bigger Backpack: offline cap
- Moon Map: Moon route acceleration
- Ledger Sense: WB queued per mile

Temporary power can still be large. Permanent power should stay small.

## WalkerBucks Rule

Distance is progress.

WalkerBucks are purchasing power.

v0.4 keeps the same economy boundary: WTW can calculate gameplay progress, queue pending reward/spend metadata, and reserve bridge-reported spendable WB for optimistic purchases, but no local save, browser state, Supabase game-save row, or WTW-owned table creates spendable WB.

Journey Tokens are not WalkerBucks. If a future prestige item costs WalkerBucks, it needs the trusted WalkerBucks bridge/API contract before implementation.

## Next Version

v0.5 should focus on content depth:

- larger item catalog
- rare cosmetics
- more follower types
- more boosts
- more scenery
- more achievements
- limited-time items
- event rewards
- title system
- collection goals
