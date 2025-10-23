# Galactic Frontier

A space exploration game built with modern web technologies.

## Project Structure

This is a mono-repo containing:

- **`shared/`** - Common assets and code
- **`assets/`** - Game assets (sprites, sounds, UI)
- **`core/`** - Shared game logic (physics, collision, rendering)
- **`utils/`** - Helper functions (math, input)
- **`config/`** - Game constants and configuration
- **`single-player/`** - Primary single-player game
- **`mmo/`** - Future MMO implementation
- **`tests/`** - Test suite
- **`docs/`** - Documentation

## Getting Started

1. The game configuration is centralized in `config/config.json`
2. Single-player game is the primary focus
3. Use the developer dashboard in `single-player/dashboard/` to edit game settings

## Development

Start with the single-player implementation in `single-player/src/`.
