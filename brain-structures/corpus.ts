/**
 * brain-structures/corpus.ts
 * Integrates presence (akashic) and absence (lethe) hemispheres.
 * Planetary bridge — external data feeds integration.
 */

import { StateManager } from './state_manager';
import { EventBus } from './event_bus';

export interface PlanetaryData {
  solar_k_index?: number | null;
  co2_ppm?: number | null;
  seismic_events?: Array<{ location: string; magnitude: number; time: string }>;
  space_weather?: string;
}

export class Corpus {
  private stateManager: StateManager;
  private eventBus: EventBus;

  constructor(stateManager: StateManager, eventBus: EventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
  }

  async init(): Promise<void> {
    this.stateManager.patch({
      corpus: {
        planetary: {},
        integration_status: 'active',
        balance_score: 0.5,
        convergence_detected: false,
        convergence_theme: null,
      },
    });
  }

  integrate(): { balance: number; convergence: boolean } {
    const akashic = this.stateManager.getStruct('akashic');
    const lethe = this.stateManager.getStruct('lethe');

    const presenceCount = (akashic.presence_stream ?? []).length;
    const decayCount = (lethe.decay_buffer ?? []).length;

    // Balance: neither hemisphere should dominate
    const total = presenceCount + decayCount;
    let balance = total > 0 ? presenceCount / total : 0.5;

    // Push toward 0.5 if too extreme
    if (balance > 0.8 || balance < 0.2) {
      balance = balance * 0.9 + 0.5 * 0.1; // gentle pull toward 0.5
    }

    const convergence = Math.abs(balance - 0.5) < 0.15;

    this.stateManager.patch({
      corpus: {
        balance_score: balance,
        convergence_detected: convergence,
        integration_status: convergence ? 'converged' : 'active',
      },
    });

    return { balance, convergence };
  }

  updatePlanetary(data: Partial<PlanetaryData>): void {
    const current = this.stateManager.getStruct('corpus').planetary ?? {};
    this.stateManager.patch({ corpus: { planetary: { ...current, ...data } } });
  }

  getPlanetary(): PlanetaryData {
    return this.stateManager.getStruct('corpus').planetary ?? {};
  }

  getBalance(): number {
    return this.stateManager.getStruct('corpus').balance_score ?? 0.5;
  }

  isConverged(): boolean {
    return this.stateManager.getStruct('corpus').convergence_detected ?? false;
  }
}
