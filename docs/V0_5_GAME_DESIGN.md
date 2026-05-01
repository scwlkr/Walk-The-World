# Walk The World v0.5 Game Design

Last updated: 2026-05-01

## Identity

v0.5 turns the replayable v0.4 journey loop into a collection-depth loop.

The player should now understand:

```text
I have a build.
I have rare stuff.
I have collection goals.
I can equip a title and show what kind of walker I am.
```

## Verified Baseline

v0.4 is verified as complete for:

- Distance Traveled, DPS, DPT, tapping, passive progress, and offline progress
- upgrades, followers, morale, cosmetics, boosts, achievements, milestones, regions, route encounters, weather events, daily/weekly quests
- WalkerBucks-settled spending and queued rewards
- Journey Reset, Journey Tokens, Journey Upgrades, and Moon route unlock
- guest play without Supabase or WalkerBucks bridge configuration

## v0.5 Feature Boundary

In scope:

- larger runtime item catalog without regenerating CSV/generated catalog sources
- rare cosmetics that help follower morale or stability
- more follower types
- more boosts, including DPS, follower-stability, and follower-recruit boosts
- more scenery beats using existing route/background assets
- more achievements and collection goals
- limited-time seasonal item offer
- profile title system
- collection-goal UI in the normal Stats path

Still out of scope:

- peer marketplace depth
- shared inventory ownership merge
- crafting
- Discord and Telegram reward linking
- WalkerBucks-priced Journey Reset purchases
- new canonical WalkerBucks item/shop ownership

## WalkerBucks Rule

Distance is progress.

WalkerBucks are purchasing power.

v0.5 keeps the same economy boundary: WTW can own app-layer gameplay items, inventory presentation, collection goals, cosmetics, and title display, but spendable WB still comes only from the WalkerBucks bridge/API. No local save, browser state, Supabase game-save row, or WTW-owned table creates spendable WB.

## Content Depth

v0.5 adds runtime catalog overlays for:

- Fresh Socks
- Walking Playlist
- Peace Offering Granola
- Group Chat Invite
- Matching Tracksuits
- Golden Sneakers
- Spring Stride Crown
- Boardwalk Shell
- World Tour Pin
- Moon Rock Souvenir

These items are app-layer gameplay content. WB purchases still settle through WalkerBucks before becoming final.

## Collection Goals

Collection goals are derived from existing save state:

- Starter Backpack Set: own six different items
- Souvenir Shelf: own five collectibles
- Rare Case: own three rare-or-better items
- Fit Check: own three cosmetics
- World Tour Map: reach twelve Earth regions

Completed goals unlock local profile titles. They do not create spendable WB.

## Titles

Titles are local profile presentation. They can be unlocked by:

- collection goals
- title-bearing items
- achievement rewards

Titles are preserved through Journey Reset with profile state. They are not WalkerBucks balances, marketplace items, or transferable ledger assets.

## Next Version

v1.0 should focus on full-game shape:

- balance pass across active, idle, follower, boost, and prestige builds
- more complete title/collection polish
- route pacing polish
- production QA
- live-service smoke proof
- clearer v1.0 go/no-go checklist
