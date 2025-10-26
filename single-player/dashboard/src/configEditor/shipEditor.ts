import { actions, dashboardState, subscribe } from '../state';
import type { DashboardSubscriber, GalacticFrontierConfig } from '../types';

const containerId = 'shipEditor';

const getContainer = (): HTMLElement | null => document.getElementById(containerId);

const numberInput = (id: string, label: string, value: number, step = 0.01, help?: string): string => `
  <label class="gf-form__field gf-field--inline">
    <span class="gf-form__label">${label}</span>
    <input id="${id}" class="gf-input" type="text"  pattern="[0-9]*.?[0-9]*" value="${String(value)}"/>
    ${help ? `<small class="gf-help">${help}</small>` : ''}
  </label>
`;

const render = (config: GalacticFrontierConfig | null): void => {
  const root = getContainer();
  if (!root) return;
  if (!config) {
    root.innerHTML = '<p>Configuration not loaded.</p>';
    return;
  }
  const ship = config.ship;
  root.innerHTML = `
    <div class="gf-form gf-form--grid">
      ${numberInput('ship-maxSpeed', 'Max Speed', ship.maxSpeed, 0.01, 'Increase to make the player ship move faster (top speed).')}
      ${numberInput('ship-thrust', 'Thrust', ship.thrust, 0.01, 'Acceleration per frame. Higher reaches top speed quicker.')}
      ${numberInput('ship-size', 'Size', ship.size, 0.01, 'Effective collision radius. Larger = easier to hit.')}
      ${numberInput('ship-maxHealth', 'Max Health', ship.maxHealth, 0.01, 'Total hit points before game over.')}
      ${numberInput('ship-afterburnerBoost', 'Afterburner Boost (x)', ship.afterburnerBoost, 0.01, 'Speed multiplier while boosting.')}
      ${numberInput('ship-afterburnerMax', 'Afterburner Max', ship.afterburnerMax, 0.01, 'Maximum afterburner energy capacity.')}
      ${numberInput('ship-afterburnerDepleteRate', 'Afterburner Deplete Rate', ship.afterburnerDepleteRate, 0.01, 'Energy consumed per frame when boosting.')}
      ${numberInput('ship-afterburnerRegenRate', 'Afterburner Regen Rate', ship.afterburnerRegenRate, 0.01, 'Energy recovered per frame when not boosting.')}
    </div>
  `;

  const onChange = (id: string, path: (cfg: GalacticFrontierConfig) => number, set: (cfg: GalacticFrontierConfig, v: number) => void) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return;
    el.addEventListener('input', () => {
      const raw = Number(el.value);
      if (!Number.isFinite(raw)) return;
      const next: GalacticFrontierConfig = JSON.parse(JSON.stringify(dashboardState.config));
      set(next, raw);
      actions.setConfig(next);
    });
  };

  onChange('ship-maxSpeed', (c) => c.ship.maxSpeed, (c, v) => { c.ship.maxSpeed = v; });
  onChange('ship-thrust', (c) => c.ship.thrust, (c, v) => { c.ship.thrust = v; });
  onChange('ship-size', (c) => c.ship.size, (c, v) => { c.ship.size = v; });
  onChange('ship-maxHealth', (c) => c.ship.maxHealth, (c, v) => { c.ship.maxHealth = v; });
  onChange('ship-afterburnerBoost', (c) => c.ship.afterburnerBoost, (c, v) => { c.ship.afterburnerBoost = v; });
  onChange('ship-afterburnerMax', (c) => c.ship.afterburnerMax, (c, v) => { c.ship.afterburnerMax = v; });
  onChange('ship-afterburnerDepleteRate', (c) => c.ship.afterburnerDepleteRate, (c, v) => { c.ship.afterburnerDepleteRate = v; });
  onChange('ship-afterburnerRegenRate', (c) => c.ship.afterburnerRegenRate, (c, v) => { c.ship.afterburnerRegenRate = v; });
};

const onState: DashboardSubscriber['notify'] = (snapshot) => {
  render(snapshot.config);
};

export const initializeShipEditor = (): void => {
  const sub: DashboardSubscriber = { id: 'ship-editor', notify: onState };
  subscribe(sub);
  render(dashboardState.config);
};


