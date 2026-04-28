**Big Scope Questions**

1. What does “C Version” mean to you: a better single-player game, the first online Walker World game, or the first public economy-connected release?
- the first online walker world game with a connected public economy
2. Must every roadmap item in [README.md](/Users/shanewalker/Desktop/dev/Walk-The-World/README.md:178) ship in C, or should C be a staged milestone with some items deferred?
- every milestone should be shipped or have a clear doccument discussing what lies in the way of it being shipped and how to resolve it
3. Who is the C-version player: just you/testing, friends/private beta, Discord community, or public launch?
- friends/private beta
4. What is the main win condition for C: more fun minute-to-minute, longer retention, account persistence, economy integration, or social competition?
- account persistence, and fun minute to minute that keeps you excited
5. Do you want this to stay a simple idle/clicker, or become more of a collection/progression RPG over time?
- it is an idle clicker but you are collecting cool items and helpful things along the way, i am unsure exactly what you are asking

**Game Design Questions**

6. Should achievements be passive badges, reward-bearing milestones, or both?
- both
7. Should inventory items be consumables, collectibles, equipment, quest items, or marketplace-owned assets?
- maybe a mix? I don't know what this means really. 
8. Are cosmetics purely visual, or should some cosmetics affect gameplay?
- cosmetics should affect gameplay
9. What is the intended prestige loop: reset Earth progress for bonuses, unlock a new world, or both?
- both
10. Should Moon be a full second world with its own landmarks/upgrades, or an alternate skin/route first?
- unknown, whatever makes the most sense. the miles will be the actual miles to the moon
11. Should Mars/Solar System tiers be planned now, or only architected so they are easy to add later?
- they should be planned for future udpates
12. How goofy should the writing stay as systems expand: fully absurd, lightly comedic, or more polished Walker World canon? a mix, make sure to have a good mix of fun internet slang, and comedic elements

**Economy / Online Questions**

13. Is WalkerBucks still “no real-money value,” or is the shared economy expected to connect to anything user-owned or exchange-like later?
- ultimately your walkerbucks would hopefully be connected to your account 'google account' then you can use them on discord and in the game
14. Should local WB and server WB be separate currencies, or should C migrate all WB to server-authoritative rewards?
- whatever makes the most sense
15. Do you already have a WalkerBucks API repo/spec, or do we need to design the first API contract here?
- all of the walkerbucks api and internal management follows this repo https://github.com/scwlkr/WalkerBucks.git walkerbucks will always be routed through this hopefully. 
16. Should Supabase own auth, profiles, saves, leaderboards, inventory, and daily quest state?
- unknown
17. Do users need email/password login, magic link, Discord login, Telegram login, or anonymous guest saves first?
- it should be easy for users to connect google auth, discord auth if easy, and a simple email password option. (ultimately walkerbucks should be connected to the account so i am not sure how that will work)
18. What counts as cheating that C must prevent: edited localStorage, bot clicking, replayed reward requests, leaderboard spoofing? I am not too concerned about cheating right now. 

**Social / External Integrations**

19. What should leaderboards rank: distance, WB earned, loops completed, daily progress, events claimed, or prestige tier? maybe all if possible
20. Should daily quests be generated locally, server-assigned, or manually configured? generate locally
21. What should seasonal events actually change: visuals, quests, limited cosmetics, rewards, route/world rules? visuals, quest and rewards
22. What should Discord/Telegram reward bridge do: grant WB for community actions, announce milestones, verify accounts, or all of that? unknown, it will connect to the walkerbucks economy hopefully https://github.com/scwlkr/WalkerBucks.git
23. Do you already have Discord/Telegram bots or app credentials for this universe? all i have is this so far https://github.com/scwlkr/WalkerBucks.git and my walker world discord server https://github.com/scwlkr/walker-world-discord.git

**Assets / Feel**

24. The repo already has a walker sheet, many background composites, and music assets under the C asset pipeline. Are these the intended C assets, placeholders, or first-pass references?
- these are first past refrences that will need to be refined and depth added later for example the backgrounds don't seemlessly blend together yet. also i have a bunch of music tracks to be added i think only one is used now. 
25. Do you want pixel art to be strict pixel-art style, or is “blocky/cartoony game art” acceptable?
strictly pixel art
26. Should the walker have idle/jump/celebration/event animations in C, or only walking for now?
- make all animations that you can, we will definetly also need an animation for when the screen is clicked
27. Should music auto-play after user interaction, have a track picker, or just loop one main theme?
- there should be a track picker so all of the tracks i have get played at some point
28. Do we need licensed-source tracking for every asset before this becomes public?
- I don't know what that is but i don't think so, this is mainly for my friends and such i'm not too worried about getting ripped off

**Planning / Workflow Questions**

29. Where do you want the persistent checklist: `docs/C_VERSION_PLAN.md`, `docs/C_VERSION_CHECKLIST.md`, `docs/PHASE_HANDOFF.md`, or a different convention?
- anywhere you want
30. Do you want me to create one giant master plan, or split C into executable phases with acceptance gates?
- whatever you think is actually doable, make realistic goals that also push codex to be great but don't ask for the impossible
31. Should each phase be small enough for one agent session, or are multi-day phases acceptable?
- unknown
32. Should I prioritize “playable improvements first” before backend/economy work, or build the backend foundation before adding more gameplay?
- prioritize making the playable improvements
33. Are there any roadmap items you already know are non-negotiable for C?
- unknown, the walkerbucks economy is pretty important tho. 
34. Are there any roadmap items you listed that are more like future dreams than C requirements?
- unknown
