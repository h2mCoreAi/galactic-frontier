Galactic Frontier Game Outline
Project Structure (Mono Repo)

Root
/shared: Common assets and code
/assets: Sprites, sounds, UI (ships, pirates, effects)
/core: Shared logic (physics, collision, rendering)
/utils: Helper functions (math, input)
/config: Game constants
config.json: Centralized configuration file for ship, projectile, enemy, and game settings




/single-player: Primary focus, single-player game
/src: Game logic (player, enemies, scoring)
/leaderboard: Local or online score tracking
/dashboard: Developer dashboard for editing config.json


/mmo: Secondary, future MMO implementation
/client: Browser-based rendering
/server: Basic server setup


/tests: Tests for shared and game code
/docs: Architecture and API docs



Single-Player Game (Galactic Frontier: Solo) - Primary Focus

Objective: Destroy space pirates, earn high scores, track on leaderboard.
Core Gameplay
Control spaceship in 2D universe.
Fight pirates (small, medium, large).
Collect power-ups (health, fan-shot).
Earn points, progress through levels.


Features
Player:
Controls:
W: Thrust (accelerate forward).
Mouse: Rotate ship to cursor.
Right Mouse Button: Shoot (single shot or fan-shot with power-up).
Spacebar: Afterburner (temporary speed boost, consumes afterburner bar).


Health System: Depletes on enemy hits/collisions (max configurable HP).
Afterburner Bar: Limited resource, depletes with use, regenerates slowly (configurable).


Enemies: Pirate AI (pursuit, shooting), level-based difficulty (configurable stats).
Scoring: Points per enemy, level up at configurable threshold.
Leaderboard: Top 10 scores (LocalStorage or backend API).
Power-Ups: Health (configurable HP gain), fan-shot (configurable duration).
UI: HUD (score, level, health, afterburner bar, hit %); game over screen.


Configuration (config.json):
Stored in /shared/config/config.json.
Loaded by game at startup, applied to ship, enemies, projectiles, etc.
Example structure:{
  "ship": {
    "maxSpeed": 5,
    "thrust": 0.1,
    "afterburnerBoost": 2,
    "afterburnerMax": 100,
    "afterburnerDepleteRate": 5,
    "afterburnerRegenRate": 1,
    "maxHealth": 100,
    "size": 20
  },
  "projectiles": {
    "speed": 7,
    "life": 100,
    "fanShotCount": 10,
    "fanShotAngle": 0.1047,
    "cooldown": 10
  },
  "enemies": [
    {
      "type": "small",
      "size": 10,
      "speed": 3,
      "points": 10,
      "shootInterval": 120,
      "projectileDamage": 1.25,
      "collisionDamage": 3.75
    },
    {
      "type": "medium",
      "size": 15,
      "speed": 2,
      "points": 20,
      "shootInterval": 90,
      "projectileDamage": 2.5,
      "collisionDamage": 7.5
    },
    {
      "type": "large",
      "size": 25,
      "speed": 1,
      "points": 50,
      "shootInterval": 60,
      "projectileDamage": 5,
      "collisionDamage": 12.5
    }
  ],
  "game": {
    "scoreToLevelUp": 250,
    "minSpawnInterval": 60,
    "maxSpawnInterval": 300,
    "minHealthSpawnInterval": 300,
    "maxHealthSpawnInterval": 600,
    "minFanShotSpawnInterval": 600,
    "maxFanShotSpawnInterval": 1200,
    "healthPowerUpValue": 10,
    "fanShotDuration": 600
  }
}




Developer Dashboard:
Location: /single-player/dashboard.
Tech: HTML/JS, simple UI (e.g., React or vanilla JS with Tailwind CSS).
Features:
Form-based interface to edit config.json values (ship speed, enemy stats, etc.).
Save changes to config.json (via file write or backend API).
Load and display current config for editing.
Basic validation (e.g., ensure positive numbers for speeds, health).


Access: Local dev server or hosted (e.g., static site with API for file updates).


Technical Details
Framework: HTML5 Canvas, JavaScript (extend existing code).
Config Loading: Fetch config.json at game start, apply to game objects.
Assets: Use /shared/assets for visuals.
Storage: LocalStorage for leaderboard, optional backend.
Performance: Optimize for 60 FPS, limit objects (2000 stars, 50 projectiles).



MMO Game (Galactic Frontier: MMO) - High-Level, Secondary Plan

Objective: Persistent universe, players fight pirates or each other, global leaderboard.
Core Gameplay (Future)
Cooperative pirate combat, optional PvP.
Server-managed universe, client renders visuals.
PostgreSQL for leaderboard, WebSocket for real-time sync.


Configuration: Reuse /shared/config/config.json for shared settings.
Technical Details
Client: HTML5 Canvas, reuse /shared assets and logic.
Server: Node.js/WebSocket, PostgreSQL for scores.
Minimal server load: Clients handle rendering, server syncs positions and events.



Development Plan

Mono Repo Setup: Initialize /shared, /single-player, /mmo.
Single-Player (Priority):
Implement config.json loading for ship, projectile, enemy, and game settings.
Update controls: W (thrust), mouse (rotate), right mouse (shoot), spacebar (afterburner).
Add health system and afterburner bar (configurable via config.json).
Build developer dashboard to edit config.json.
Complete core gameplay (combat, power-ups, levels).
Add leaderboard (LocalStorage, optional backend).
Polish with sounds, visuals from /shared.


MMO (Future): Plan server-client architecture, prototype after single-player.
Testing: Unit tests for config loading and shared logic, playtest balance.
Deployment: Host single-player and dashboard on static site; MMO requires server setup.
