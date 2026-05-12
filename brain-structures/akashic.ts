/**
 * brain-structures/akashic.ts
 * Presence hemisphere — what IS.
 * Current input density stream, active signal tracking.
 */

import { StateManager } from './state_manager';
import { EventBus } from './event_bus';

export interface PresenceItem {
  content: any;
  density: number; // 0–1
  timestamp: number;
}

const MAX_PRESENCE = 32;

export class Akashic {
  private stateManager: StateManager;
  private eventBus: EventBus;

  constructor(stateManager: StateManager, eventBus: EventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
  }

  async init(): Promise<void> {
    this.stateManager.patch({
      akashic: {
        presence_stream: [],
        density: 0,
      },
    });
  }

  arrive(content: any, density?: number): void {
    const presence = this.stateManager.getStruct('akashic').presence_stream ?? [];
    const computedDensity = density ?? this.computeDensity(content);

    const item: PresenceItem = {
      content,
      density: computedDensity,
      timestamp: Date.now(),
    };

    presence.unshift(item);
    if (presence.length > MAX_PRESENCE) presence.pop();

    const avgDensity = presence.reduce((sum, p) => sum + p.density, 0) / presence.length;
    this.stateManager.patch({
      akashic: {
        presence_stream: presence,
        density: avgDensity,
      },
    });
  }

  private computeDensity(content: any): number {
    // Simple heuristic: longer content = higher density
    if (typeof content === 'string') {
      return Math.min(1, content.length / 1000);
    }
    return 0.5;
  }

  getPresence(): PresenceItem[] {
    return this.stateManager.getStruct('akashic').presence_stream ?? [];
  }

  getDensity(): number {
    return this.stateManager.getStruct('akashic').density ?? 0;
  }

  clear(): void {
    this.stateManager.patch({ akashic: { presence_stream: [], density: 0 } });
  }
}
