# Walk The World v0.1 Game Design

Last updated: 2026-04-30

## Identity

Walk The World is an incremental walking game.

The v0.1 fantasy is simple: one person starts walking, distance grows, upgrades make the walking machine stronger, and the player always sees the next place they are trying to reach.

Inspirations:

- Cookie Clicker
- Idle walking simulator
- World travel map
- Fake internet economy

## Core Terms

- Distance Traveled (DT): total progress. This is the main number.
- Distance Per Second (DPS): passive distance gained every second.
- Distance Per Tap (DPT): active distance gained per tap/click.
- WalkerBucks (WB): purchasing power. WB is settled by the WalkerBucks ledger, not local game state.

Design rule:

```text
Distance = progress
WalkerBucks = purchasing power
Items/upgrades = conversion layer
```

## v0.1 Loop

```text
Tap WALK -> gain DT -> hit milestone -> queue WB reward
-> settle WB through WalkerBucks -> buy upgrade
-> increase DPS/DPT/offline cap -> reach farther milestone
```

The UI should answer:

- Where am I walking to next?
- What unlock is coming?
- What can I buy to get there faster?

## v0.1 Feature Boundary

In scope:

- DT, DPS, DPT
- Basic tapping
- Basic idle progress
- Basic generators
- Basic tap upgrades
- Basic shop
- WalkerBucks-settled purchases
- 3-5 readable scenery zones
- Simple distance milestones
- Basic capped offline progress

Out of scope:

- Followers and morale
- Cosmetic utility
- Temporary boost catalog
- Deep item catalog
- Marketplace
- Crafting
- Complex social systems
- Journey Reset / prestige
- Region-specific events

## Current v0.1 Tuning

All values are starting hypotheses and should be playtested before public release.

| System | Value |
| --- | --- |
| Base DPT | 0.004 mi, about 21 ft |
| Base DPS | 0.0004 mi/sec, about 2.1 ft/sec |
| Base offline cap | 4 hours |
| Save version | 10 |
| Game version | 0.1.0 |

Generator cost rises exponentially. Generator production rises linearly per level.

## Upgrade Types

Active v0.1 shop types:

- Generators: raise DPS.
- Tap upgrades: raise DPT.
- Offline upgrades: raise capped offline progress.

Current active examples:

- Starter Shoes
- Fingerless Walking Gloves
- Walking Stick
- Rhythm Shoes
- Mall Walker Crew
- Backpack Upgrade
- Hydration Belt
- Treadmill Desk

## Milestones

Current v0.1 milestones:

| Milestone | Distance |
| --- | ---: |
| Leave the Couch | 100 ft |
| End of the Street | 1,000 ft |
| Around the Block | 0.25 mi |
| Neighborhood Loop | 1 mi |
| Across Town | 10 mi |
| State Line | 100 mi |
| Across America | 3,000 mi |

Major milestone rule:

Each major milestone should change at least one of these:

- what the player sees
- what the player can buy
- what the player is trying to become next

## Scenery

v0.1 uses broad scenery zones instead of exact real-world art:

- Starting room / Walkertown
- Suburb
- City
- Forest
- Desert
- Mountains

This keeps the fantasy moving without blocking on perfect custom location art.

## WalkerBucks Rule

The browser may queue pending WB rewards and spend requests, but it must not create spendable WB.

Allowed:

- Queue pending rewards for bridge settlement.
- Store failed/pending request metadata for retry visibility.
- Apply upgrades after a trusted WalkerBucks spend settles.

Not allowed:

- Local wallet balances.
- Browser-minted spendable WB.
- Local ledger, transfer, audit, shop, or marketplace ownership.

## Next Versions

- v0.2: followers, morale, cosmetics, first boosts
- v0.3: regions, events, achievements, more scenery
- v0.4: Journey Reset / prestige
- v0.5: collections, rare items, deeper catalog
- v1.0: complete balanced incremental loop
