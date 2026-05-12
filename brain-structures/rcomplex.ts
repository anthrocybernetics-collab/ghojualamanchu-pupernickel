/**
 * brain-structures/rcomplex.ts
 * Territory, threat level, environment binding.
 * The "lizard brain" — keeps the organism grounded.
 */

import { StateManager } from './state_manager';
import { EventBus } from './event_bus';

export interface TerritoryState {
  current_location?: string;
  environment?: string;
  security_level?: 'open' | 'restricted' | 'locked';
}

export class RComplex {
  private stateManager: StateManager;
  private eventBus: EventBus;

  constructor(stateManager: StateManager, eventBus: EventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
  }

  async init(): Promise<void> {
    this.stateManager.patch({
      rcomplex: {
        territory_state: {
          current_location: 'workspace',
          environment: 'standard',
          security_level: 'open',
        },
        threat_level: 0.0,
      },
    });
  }

  setTerritory(state: Partial<TerritoryState>): void {
    const current = this.stateManager.getStruct('rcomplex').territory_state ?? {};
    const updated = { ...current, ...state };
    this.stateManager.patch({ rcomplex: { territory_state: updated } });
  }

  setThreatLevel(level: number): void {
    // Clamp 0–1
    const clamped = Math.max(0, Math.min(1, level));
    this.stateManager.patch({ rcomplex: { threat_level: clamped } });

    if (clamped > 0.7) {
      this.eventBus.emit('rcomplex:high_threat', { threat_level: clamped });
    }
  }

  getThreatLevel(): number {
    return this.stateManager.getStruct('rcomplex').threat_level ?? 0;
  }

  getTerritory(): TerritoryState {
    return this.stateManager.getStruct('rcomplex').territory_state ?? {};
  }
}
