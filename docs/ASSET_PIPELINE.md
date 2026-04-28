# C Version Asset Pipeline

This repo is a Vite, React, TypeScript canvas game. Runtime assets that the app should load directly belong under `public/assets/`, because Vite serves that folder from the web root.

Keep raw/original files under `assets/source/`. Those files are for editing, reference, and future sprite work. They are not loaded by the app unless a later build step copies or processes them.

## Where To Put Current Assets

### Walker Character

If you have a single character image or concept/reference:

```text
assets/source/characters/walker/walker_reference.png
```

If you already have a game-ready idle image:

```text
public/assets/characters/walker/walker_idle.png
```

If you already have a walking sprite sheet:

```text
public/assets/characters/walker/walker_walk_right_sheet.png
```

Preferred first sprite-sheet standard:

```text
9 frames, horizontal
192x192 pixels per frame
1728x192 pixels total
transparent PNG
facing right
same ground line in every frame
```

Do not make a separate left-walk sheet yet. The game can mirror the right-facing sheet later.

### Background Images

Save original full images here:

```text
assets/source/backgrounds/<scene_name>/original.png
```

Save a temporary game-ready full background here:

```text
public/assets/backgrounds/<scene_name>/composite.png
```

When a background is split for parallax, use these layer names:

```text
public/assets/backgrounds/<scene_name>/sky.png
public/assets/backgrounds/<scene_name>/far.png
public/assets/backgrounds/<scene_name>/mid.png
public/assets/backgrounds/<scene_name>/near.png
public/assets/backgrounds/<scene_name>/foreground.png
```

Use lowercase snake_case folder names. The first prepared folders are:

```text
walkertown
dallas
grand_canyon
moon
```

The current C-version background composites are generated at 1600px wide under:

```text
public/assets/backgrounds/<scene_name>/composite.png
```

Current normalized scene folders:

```text
dallas
desert
grand_canyon
great_wall_china
london
moon_surface
niagara_falls
paris
rome
skyline
suburb
tokyo
walkertown
```

Layer rules:

- `sky.png` can be opaque.
- `far.png`, `mid.png`, `near.png`, and `foreground.png` should use transparency where possible.
- Keep the walking path visually clear near the lower third of the image.
- Avoid text, UI, logos, or characters in background files.

### Music

Save original music files here:

```text
assets/source/audio/music/
```

Save game-ready music here:

```text
public/assets/audio/music/main_theme.ogg
public/assets/audio/music/main_theme.mp3
```

Use `ogg` when available and keep an `mp3` fallback if the source already exists. Keep MVP tracks short and loopable.

Current runtime music files:

```text
public/assets/audio/music/main_theme.mp3
public/assets/audio/music/wtw_101.mp3
public/assets/audio/music/wtw_102.mp3
public/assets/audio/music/wtw_103.mp3
public/assets/audio/music/wtw_104.mp3
public/assets/audio/music/wtw_105.mp3
public/assets/audio/music/wtw_106.mp3
public/assets/audio/music/wtw_107.mp3
```

### Sound Effects

Save source/downloaded SFX packs here:

```text
assets/source/audio/sfx/
```

Save game-ready SFX here:

```text
public/assets/audio/sfx/walk_step_01.ogg
public/assets/audio/sfx/walk_step_02.ogg
public/assets/audio/sfx/button_tap.ogg
public/assets/audio/sfx/purchase.ogg
public/assets/audio/sfx/random_event.ogg
public/assets/audio/sfx/landmark.ogg
```

Add license notes for any third-party audio here:

```text
public/assets/licenses/audio.md
```

## Recommended Open Source / Free SFX Sources

Use one of these for the first pass:

- ZzFX for generated code-driven effects. It is an MIT-licensed JavaScript sound effect generator and avoids shipping many tiny SFX files.
- Kenney audio packs for file-based effects. Kenney's relevant audio packs are marked Creative Commons CC0, including Interface Sounds, UI Audio, Digital Audio, and RPG Audio.

Reference links:

- https://github.com/KilledByAPixel/ZzFX
- https://kenney.nl/assets/interface-sounds
- https://kenney.nl/assets/rpg-audio

For this game, use ZzFX for button taps, reward pings, shop purchases, and random-event sounds. Use file-based audio only where the sound needs a specific texture, such as footsteps or a music loop.

Current implementation note: MVP C uses the browser Web Audio API for generated tap, purchase, event, and UI sounds, so no third-party SFX files are required yet.

## First C-Version Asset Targets

Minimum useful drop-in set:

```text
public/assets/characters/walker/walker_walk_right_sheet.png
public/assets/backgrounds/walkertown/composite.png
public/assets/audio/music/main_theme.ogg
public/assets/audio/sfx/button_tap.ogg
public/assets/audio/sfx/purchase.ogg
public/assets/audio/sfx/random_event.ogg
```

If an asset is not game-ready yet, put it in `assets/source/` first and leave the matching `public/assets/` file absent until it is cleaned, cropped, exported, and named consistently.
