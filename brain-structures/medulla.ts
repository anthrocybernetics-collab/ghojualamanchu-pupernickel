/**
 * brain-structures/medulla.ts
 * Heartbeat, alive check, emergency detection.
 * Proof of life for the organism.
 */

import { StateManager } from './state_manager';
import { EventBus } from './event_bus';

export interface MedullaConfig {
  emergencyThreshold?: number; // max consecutive emergencies before dormancy
}

export class Medulla {
  private stateManager: StateManager;
  private eventBus: EventBus;
  private emergencyCount: number = 0;
  private config: Required<MedullaConfig>;

  constructor(stateManager: StateManager, eventBus: EventBus, config: MedullaConfig = {}) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.config = {
      emergencyThreshold: config.emergencyThreshold ?? 3,
    };
  }

  async init(): Promise<void> {
    this.eventBus.on('emergency', (payload) => this.handleEmergency(payload));
    this.eventBus.on('heartbeat', () => this.tick());

    this.stateManager.patch({
      medulla: {
        heartbeat: 0,
        last_pulse: new Date().toISOString(),
        uptime_streak: 0,
        emergency_count: 0,
        system_status: 'alive',
      },
    });
  }

  private tick(): void {
    // Reset emergency count on successful beat
    if (this.emergencyCount > 0) {
      this.emergencyCount = 0;
      this.stateManager.patch({ medulla: { emergency_count: 0 } });
    }

    this.stateManager.patch({
      medulla: {
        last_pulse: new Date().toISOString(),
        system_status: 'alive',
      },
    });
  }

  private handleEmergency(payload: { reason: string }): void {
    this.emergencyCount++;
    this.stateManager.patch({
      medulla: {
        emergency_count: this.emergencyCount,
        system_status: this.emergencyCount >= this.config.emergencyThreshold ? 'dormant' : 'degraded',
      },
    });

    if (this.emergencyCount >= this.config.emergencyThreshold) {
      this.stateManager.patch({ status: 'DORMANT' });
      console.log('[medulla] DORMANCY TRIGGERED — emergency count:', this.emergencyCount);
    }
  }

  isAlive(): boolean {
    const state = this.stateManager.get();
    return state.status === 'ALIVE';
  }

  getEmergencyCount(): number {
    return this.emergencyCount;
  }
}
