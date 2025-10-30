# Config Schema Changelog

All notable changes to the Galactic Frontier configuration schema will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-10-28

### Added
- Initial configuration schema version 1.0.0
- `version` field for schema tracking
- Ship configuration section with:
  - `maxSpeed`: Maximum ship velocity
  - `thrust`: Acceleration per frame
  - `size`: Collision radius
  - `maxHealth`: Total hit points
  - `afterburnerBoost`: Speed multiplier while boosting (optional)
  - `afterburnerMax`: Maximum afterburner energy capacity
  - `afterburnerDepleteRate`: Energy consumed per frame when boosting
  - `afterburnerRegenRate`: Energy recovered per frame when not boosting
- Projectile configuration section with:
  - `speed`: Projectile velocity
  - `life`: Projectile lifetime in frames
  - `cooldown`: Fire cooldown in frames
  - `fanShotCount`: Number of projectiles in fan shot
  - `fanShotAngle`: Spread angle for fan shot
- Enemy configuration array with:
  - `type`: Enemy type identifier (small, medium, large)
  - `size`: Enemy size/radius
  - `hitboxSize`: Optional separate hitbox size
  - `speed`: Enemy movement speed
  - `points`: Score value when destroyed
  - `shootInterval`: Frames between enemy shots
  - `projectileDamage`: Damage dealt by enemy projectiles
  - `collisionDamage`: Damage dealt on collision
- Game configuration section with:
  - `scoreToLevelUp`: Score required to level up
  - `minSpawnInterval` / `maxSpawnInterval`: Enemy spawn rate range
  - `minHealthSpawnInterval` / `maxHealthSpawnInterval`: Health power-up spawn rate range
  - `minFanShotSpawnInterval` / `maxFanShotSpawnInterval`: Fan-shot power-up spawn rate range
  - `healthPowerUpValue`: Health restored by power-up
  - `fanShotDuration`: Fan-shot power-up duration in frames
  - `maxEnemies`: Optional maximum concurrent enemies
  - `enemyTypeWeights`: Optional spawn probability weights
  - `spawnRatePerLevelFactor`: Optional spawn rate scaling per level
  - `minSpawnRateClamp`: Optional minimum spawn rate clamp
  - `levelScaling`: Optional level-based scaling values

### Migration Notes
- Configs without a `version` field will be automatically migrated to 1.0.0
- All existing fields are preserved during migration
- Missing optional fields use game defaults

---

## Schema Versioning Guidelines

### When to Bump Version

**Patch (1.0.x)**: 
- Adding optional fields that don't break existing configs
- Fixing validation bugs
- Documentation improvements

**Minor (1.x.0)**:
- Adding new optional sections
- Deprecating fields (old configs still work)
- Adding new optional properties to existing sections

**Major (x.0.0)**:
- Removing required fields
- Changing field types
- Breaking changes that require manual migration

### Rollback Considerations

When restoring backups from older schema versions:
- The dashboard will warn about version mismatches
- Automatic migration is attempted when possible
- Manual review recommended for major version downgrades
- Backup version is displayed in the backup list for reference

---

## Future Planned Changes

### Proposed for 1.1.0
- Additional enemy types configuration
- Power-up spawn rate controls
- Wave-based spawn patterns

### Proposed for 2.0.0
- Multiplayer-specific configuration sections
- Advanced rendering options
- Performance tuning parameters

