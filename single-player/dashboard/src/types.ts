export type TabKey = 'overview' | 'config' | 'testing' | 'documentation' | 'settings';

export interface ShipConfig {
  readonly maxSpeed: number;
  readonly thrust: number;
  readonly afterburnerBoost?: number;
  readonly afterburnerMax: number;
  readonly afterburnerDepleteRate: number;
  readonly afterburnerRegenRate: number;
  readonly maxHealth: number;
  readonly size: number;
}

export interface ProjectileConfig {
  readonly speed: number;
  readonly life: number;
  readonly fanShotCount: number;
  readonly fanShotAngle: number;
  readonly cooldown: number;
}

export interface EnemyConfig {
  readonly type: string;
  readonly size: number;
  readonly speed: number;
  readonly points: number;
  readonly shootInterval: number;
  readonly projectileDamage: number;
  readonly collisionDamage: number;
}

export interface GameConfig {
  readonly scoreToLevelUp: number;
  readonly minSpawnInterval: number;
  readonly maxSpawnInterval: number;
  readonly minHealthSpawnInterval: number;
  readonly maxHealthSpawnInterval: number;
  readonly minFanShotSpawnInterval: number;
  readonly maxFanShotSpawnInterval: number;
  readonly healthPowerUpValue: number;
  readonly fanShotDuration: number;
}

export interface GalacticFrontierConfig {
  readonly ship: ShipConfig;
  readonly projectiles: ProjectileConfig;
  readonly enemies: EnemyConfig[];
  readonly game: GameConfig;
  readonly version?: string;
}

export interface ConfigSchemaVersion {
  readonly version: string;
  readonly schema: Record<string, unknown>;
}

export interface DashboardRoutingState {
  readonly tab: TabKey;
}

export interface DashboardBackup {
  readonly id: string;
  readonly createdAt: string;
  readonly size: number;
  readonly path?: string;
}

export interface DashboardMetrics {
  readonly fps: number;
  readonly enemies: number;
  readonly projectiles: number;
  readonly score: number;
  readonly level: number;
  readonly shipsHealth: number;
  readonly afterburner: number;
  readonly timestamp: number;
}

export interface DashboardPreferences {
  readonly defaultTab: TabKey;
  readonly autoRefreshInterval: number;
}

export interface DashboardBreadcrumbs {
  readonly primary: string;
  readonly secondary?: string;
}

export interface AutoRefreshController {
  readonly start: (intervalSeconds: number) => void;
  readonly stop: () => void;
}

export interface DashboardConnectivity {
  readonly backendAvailable: boolean;
  readonly lastChecked: string | null;
}

export interface DashboardStateSnapshot {
  readonly tab: TabKey;
  readonly theme: 'light' | 'dark';
  readonly preferences: DashboardPreferences;
  readonly breadcrumbs: DashboardBreadcrumbs;
  readonly connectivity: DashboardConnectivity;
  readonly config: GalacticFrontierConfig | null;
  readonly originalConfig: GalacticFrontierConfig | null;
  readonly backups: DashboardBackup[];
  readonly metrics: DashboardMetrics | null;
  readonly authenticated: boolean;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastSavedAt: string | null;
  readonly hasUnsavedChanges: boolean;
}

export interface DashboardSubscriber {
  readonly id: string;
  readonly notify: (snapshot: DashboardStateSnapshot) => void;
}

export interface DashboardActions {
  readonly setTab: (tab: TabKey) => void;
  readonly setTheme: (theme: 'light' | 'dark') => void;
  readonly updatePreferences: (preferences: Partial<DashboardPreferences>) => void;
  readonly setBreadcrumbs: (breadcrumbs: Partial<DashboardBreadcrumbs>) => void;
  readonly setConnectivity: (connectivity: Partial<DashboardConnectivity>) => void;
  readonly setConfig: (config: GalacticFrontierConfig, markDirty?: boolean) => void;
  readonly markSaved: () => void;
  readonly setBackups: (backups: DashboardBackup[]) => void;
  readonly setMetrics: (metrics: DashboardMetrics | null) => void;
  readonly setAuthentication: (authenticated: boolean) => void;
  readonly setLoading: (loading: boolean) => void;
  readonly setError: (error: string | null) => void;
}
