/**
 * brain-structures/amygdala.ts
 * Salience tagging, threat/reward weighting.
 * Decides what matters in the current input stream.
 */

import { StateManager } from './state_manager';
import { EventBus } from './event_bus';

export interface SalienceTag {
  key: string;
  value: number; // 0–1
  timestamp: number;
}

export class Amygdala {
  private stateManager: StateManager;
  private eventBus: EventBus;

  constructor(stateManager: StateManager, eventBus: EventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
  }

  async init(): Promise<void> {
    this.stateManager.patch({
      amygdala: {
        salience_tags: {},
        threat_rewards: {},
      },
    });
  }

  tag(key: string, value: number, ttlMs?: number): void {
    const tags = this.stateManager.getStruct('amygdala').salience_tags ?? {};
    tags[key] = { key, value, timestamp: Date.now() };
    this.stateManager.patch({ amygdala: { salience_tags: tags } });

    if (ttlMs) {
      setTimeout(() => this.untag(key), ttlMs);
    }

    // High salience → alert thalamus
    if (value > 0.8) {
      this.eventBus.emit('amygdala:high_salience', { key, value });
    }
  }

  untag(key: string): void {
    const tags = this.stateManager.getStruct('amygdala').salience_tags ?? {};
    delete tags[key];
    this.stateManager.patch({ amygdala: { salience_tags: tags } });
  }

  weightThreat(key: string, weight: number): void {
    const threats = this.stateManager.getStruct('amygdala').threat_rewards ?? {};
    threats[key] = Math.max(0, Math.min(1, weight));
    this.stateManager.patch({ amygdala: { threat_rewards: threats } });
  }

  getSalience(key: string): number {
    return this.stateManager.getStruct('amygdala').salience_tags?.[key]?.value ?? 0;
  }

  getAllTags(): Record<string, SalienceTag> {
    return this.stateManager.getStruct('amygdala').salience_tags ?? {};
  }
}
