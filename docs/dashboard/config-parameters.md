# Configuration Parameters Reference

Complete documentation of all `config.json` parameters and their effects on gameplay.

## Ship Configuration

### `ship.maxSpeed`
- **Type**: `number`
- **Default**: `6`
- **Range**: `> 0`
- **Description**: Maximum velocity of the player ship in pixels per frame
- **Effect**: Higher values make the ship move faster, improving maneuverability but potentially making control more difficult
- **Recommended Range**: `4-10`

### `ship.thrust`
- **Type**: `number`
- **Default**: `0.1`
- **Range**: `> 0`
- **Description**: Acceleration per frame applied when moving
- **Effect**: Higher values allow the ship to reach max speed faster. Lower values create more gradual acceleration
- **Recommended Range**: `0.05-0.2`

### `ship.size`
- **Type**: `number`
- **Default**: `20`
- **Range**: `> 0`
- **Description**: Collision radius in pixels
- **Effect**: Larger size makes the ship easier to hit by enemies and projectiles, but also easier to hit enemies
- **Recommended Range**: `15-30`

### `ship.maxHealth`
- **Type**: `number`
- **Default**: `100`
- **Range**: `> 0`
- **Description**: Maximum hit points before game over
- **Effect**: Higher values increase survivability and allow more mistakes
- **Recommended Range**: `50-200`

### `ship.afterburnerBoost`
- **Type**: `number` (optional)
- **Default**: `2`
- **Range**: `> 1`
- **Description**: Speed multiplier applied when afterburner is active
- **Effect**: Higher values provide greater speed boost during boost, consuming energy faster
- **Recommended Range**: `1.5-3`

### `ship.afterburnerMax`
- **Type**: `number`
- **Default**: `100`
- **Range**: `> 0`
- **Description**: Maximum afterburner energy capacity
- **Effect**: Higher values allow longer boost duration before depletion
- **Recommended Range**: `50-200`

### `ship.afterburnerDepleteRate`
- **Type**: `number`
- **Default**: `1`
- **Range**: `> 0`
- **Description**: Energy consumed per frame when boosting
- **Effect**: Higher values deplete boost faster, limiting boost duration
- **Recommended Range**: `0.5-2`

### `ship.afterburnerRegenRate`
- **Type**: `number`
- **Default**: `0.5`
- **Range**: `> 0`
- **Description**: Energy recovered per frame when not boosting
- **Effect**: Higher values allow faster recovery between boosts
- **Recommended Range**: `0.25-1`

## Projectile Configuration

### `projectiles.speed`
- **Type**: `number`
- **Default**: `10`
- **Range**: `> 0`
- **Description**: Projectile velocity in pixels per frame
- **Effect**: Higher values make projectiles travel faster, improving hit rate but potentially making aim more difficult
- **Recommended Range**: `8-15`

### `projectiles.life`
- **Type**: `number`
- **Default**: `100`
- **Range**: `> 0`
- **Description**: Lifetime of projectiles in frames before despawning
- **Effect**: Higher values allow projectiles to travel further, improving long-range accuracy
- **Recommended Range**: `60-150`

### `projectiles.cooldown`
- **Type**: `number`
- **Default**: `10`
- **Range**: `> 0`
- **Description**: Frames between allowed shots
- **Effect**: Lower values increase fire rate, improving DPS but potentially overwhelming the player
- **Recommended Range**: `5-20`

### `projectiles.fanShotCount`
- **Type**: `number`
- **Default**: `10`
- **Range**: `> 0`
- **Description**: Number of projectiles fired simultaneously in fan-shot mode
- **Effect**: Higher values create wider spread, improving area coverage but reducing single-target damage
- **Recommended Range**: `5-15`

### `projectiles.fanShotAngle`
- **Type**: `number`
- **Default**: `0.1047` (~6 degrees)
- **Range**: `> 0`
- **Description**: Spread angle in radians for fan-shot mode
- **Effect**: Larger angles create wider spread pattern
- **Recommended Range**: `0.05-0.2` (3-12 degrees)

## Enemy Configuration

Each enemy type in the `enemies` array has the following parameters:

### `enemies[].type`
- **Type**: `string`
- **Description**: Unique identifier for the enemy type (e.g., "small", "medium", "large")
- **Note**: Must be unique across all enemy definitions

### `enemies[].speed`
- **Type**: `number`
- **Range**: `> 0`
- **Description**: Movement speed in pixels per frame
- **Effect**: Higher values make enemies move faster, increasing difficulty
- **Relationship**: Often inversely related to size (small = fast, large = slow)

### `enemies[].size`
- **Type**: `number`
- **Range**: `> 0`
- **Description**: Collision radius in pixels
- **Effect**: Larger enemies are easier to hit but harder to avoid

### `enemies[].hitboxSize`
- **Type**: `number` (optional)
- **Range**: `> 0`
- **Description**: Separate hitbox radius if different from visual size
- **Effect**: Allows fine-tuning collision detection independent of visual representation
- **Default**: Uses `size` if not specified

### `enemies[].points`
- **Type**: `number`
- **Range**: `> 0`
- **Description**: Score awarded when enemy is destroyed
- **Effect**: Higher values make enemies more valuable targets
- **Relationship**: Usually correlates with size/difficulty

### `enemies[].shootInterval`
- **Type**: `number`
- **Range**: `> 0`
- **Description**: Frames between enemy shots
- **Effect**: Lower values make enemies shoot more frequently, increasing threat level
- **Recommended Range**: `30-120`

### `enemies[].projectileDamage`
- **Type**: `number`
- **Range**: `> 0`
- **Description**: Damage dealt by enemy projectiles
- **Effect**: Higher values make enemy shots more dangerous
- **Relationship**: Should balance with ship maxHealth and projectile frequency

### `enemies[].collisionDamage`
- **Type**: `number`
- **Range**: `> 0`
- **Description**: Damage dealt when colliding with player ship
- **Effect**: Higher values punish collisions more severely
- **Note**: Usually higher than projectileDamage as collision should be discouraged

## Game Configuration

### `game.scoreToLevelUp`
- **Type**: `number`
- **Default**: `250`
- **Range**: `> 0`
- **Description**: Score required to advance to next level
- **Effect**: Higher values slow progression, lower values speed it up
- **Recommended Range**: `200-500`

### `game.minSpawnInterval` / `game.maxSpawnInterval`
- **Type**: `number`
- **Default**: `60` / `300`
- **Range**: `> 0`, `min <= max`
- **Description**: Random range for frames between enemy spawns
- **Effect**: Lower values spawn enemies more frequently, increasing difficulty
- **Recommended Range**: `40-400`

### `game.minHealthSpawnInterval` / `game.maxHealthSpawnInterval`
- **Type**: `number`
- **Default**: `300` / `600`
- **Range**: `> 0`, `min <= max`
- **Description**: Random range for frames between health power-up spawns
- **Effect**: Controls how often players can recover health
- **Recommended Range**: `200-800`

### `game.healthPowerUpValue`
- **Type**: `number`
- **Default**: `10`
- **Range**: `> 0`
- **Description**: Health restored when collecting health power-up
- **Effect**: Higher values provide more recovery per pickup
- **Relationship**: Should be balanced with maxHealth (e.g., 10% of maxHealth)

### `game.minFanShotSpawnInterval` / `game.maxFanShotSpawnInterval`
- **Type**: `number`
- **Default**: `600` / `1200`
- **Range**: `> 0`, `min <= max`
- **Description**: Random range for frames between fan-shot power-up spawns
- **Effect**: Controls frequency of powerful fan-shot mode availability
- **Recommended Range**: `400-1600`

### `game.fanShotDuration`
- **Type**: `number`
- **Default**: `600`
- **Range**: `> 0`
- **Description**: Duration of fan-shot power-up in frames
- **Effect**: Longer duration provides more time to clear enemies
- **Recommended Range**: `300-900`

### `game.maxEnemies`
- **Type**: `number` (optional)
- **Default**: `50`
- **Range**: `> 0`
- **Description**: Maximum number of enemies active simultaneously
- **Effect**: Caps enemy count to prevent performance issues and overwhelming gameplay
- **Recommended Range**: `30-100`

### `game.enemyTypeWeights`
- **Type**: `object` (optional)
- **Default**: `{ small: 0.5, medium: 0.3, large: 0.2 }`
- **Description**: Relative spawn probability weights for each enemy type
- **Effect**: Controls enemy variety - higher weights = more frequent spawns
- **Note**: Weights are normalized, so absolute values don't matter, only ratios

### `game.spawnRatePerLevelFactor`
- **Type**: `number` (optional)
- **Default**: `0.9`
- **Range**: `0 < value <= 1`
- **Description**: Multiplier applied to spawn intervals per level
- **Effect**: Values < 1 make enemies spawn faster as levels increase
- **Example**: `0.9` means spawn rate increases 10% per level

### `game.minSpawnRateClamp`
- **Type**: `number` (optional)
- **Default**: `0.3`
- **Range**: `0 < value <= 1`
- **Description**: Minimum spawn rate factor (prevents spawn rate from becoming too fast)
- **Effect**: Caps maximum spawn frequency increase from level scaling
- **Relationship**: Works with `spawnRatePerLevelFactor` to create difficulty curve

### `game.levelScaling`
- **Type**: `object` (optional)
- **Description**: Per-level multipliers applied to enemy stats

#### `game.levelScaling.enemySpeedPerLevel`
- **Type**: `number` (optional)
- **Default**: `1.05`
- **Range**: `> 0`
- **Description**: Multiplier for enemy speed per level
- **Effect**: Values > 1 make enemies faster each level (5% increase per level)

#### `game.levelScaling.projectileDamagePerLevel`
- **Type**: `number` (optional)
- **Default**: `1.1`
- **Range**: `> 0`
- **Description**: Multiplier for enemy projectile damage per level
- **Effect**: Values > 1 make enemy shots more dangerous each level (10% increase)

#### `game.levelScaling.collisionDamagePerLevel`
- **Type**: `number` (optional)
- **Default**: `1.15`
- **Range**: `> 0`
- **Description**: Multiplier for collision damage per level
- **Effect**: Values > 1 make collisions more punishing each level (15% increase)

## Parameter Relationships

### Difficulty Balance
- Enemy speed vs. ship maxSpeed: Enemies should generally be slower or equal to ship speed for fair gameplay
- Enemy shootInterval vs. player cooldown: Enemy fire rate should be lower than player fire rate to maintain advantage
- Spawn intervals vs. enemy count: Faster spawns + high maxEnemies = intense gameplay

### Performance Considerations
- High projectile life + high projectile speed = more projectiles active simultaneously
- Low spawn intervals + high maxEnemies = more objects to render and update
- Level scaling factors compound quickly - moderate values (1.05-1.15) recommended

### Gameplay Flow
- scoreToLevelUp vs. enemy points: Controls how many enemies needed per level
- Power-up spawn rates vs. difficulty: More frequent power-ups = easier game
- Fan-shot duration vs. spawn intervals: Controls how many enemies can be cleared per power-up

## Best Practices

1. **Start Conservative**: Begin with defaults and adjust gradually
2. **Test Incrementally**: Change one parameter at a time to understand effects
3. **Balance with Levels**: Ensure level scaling doesn't make game too difficult too quickly
4. **Consider Performance**: Monitor FPS when increasing spawn rates or object counts
5. **Player Feedback**: Test with actual gameplay to ensure feel is right
6. **Version Control**: Use backups before making major changes

## Configuration Examples

### Easy Mode
```json
{
  "ship": { "maxHealth": 150, "maxSpeed": 7 },
  "game": { "scoreToLevelUp": 200, "spawnRatePerLevelFactor": 0.95 }
}
```

### Hard Mode
```json
{
  "ship": { "maxHealth": 75, "maxSpeed": 5 },
  "game": { "scoreToLevelUp": 400, "spawnRatePerLevelFactor": 0.85 },
  "enemies": [/* higher speeds and lower shoot intervals */]
}
```

### Performance Test
```json
{
  "game": { "maxEnemies": 100, "minSpawnInterval": 30 }
}
```

