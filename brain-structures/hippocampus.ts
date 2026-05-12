/**
 * brain-structures/hippocampus.ts
 * Memory encode, consolidate, working context.
 * Feeds MemPalace integration for long-term decay.
 */

import { StateManager } from './state_manager';
import { EventBus } from './event_bus';

export interface MemoryItem {
  id: string;
  content: any;
  encoded_at: number;
  last_accessed: number;
  salience: number; // 0–1, used by Lethe for decay priority
  type: 'working' | 'consolidated';
}

export class Hippocampus {
  private stateManager: StateManager;
  private eventBus: EventBus;

  constructor(stateManager: StateManager, eventBus: EventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
  }

  async init(): Promise<void> {
    this.stateManager.patch({
      hippocampus: {
        working_memory: [],
        longterm_memory: [],
        consolidation_queue: [],
        last_consolidation: null,
      },
    });
  }

  encode(content: any, salience: number = 0.5): string {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item: MemoryItem = {
      id,
      content,
      encoded_at: Date.now(),
      last_accessed: Date.now(),
      salience,
      type: 'working',
    };

    const working = [...(this.stateManager.getStruct('hippocampus').working_memory ?? []), item];

    // Enforce working memory cap (8 items max)
    while (working.length > 8) {
      const evicted = working.shift();
      if (evicted) {
        this.enqueueConsolidation(evicted);
      }
    }

    this.stateManager.patch({ hippocampus: { working_memory: working } });
    this.eventBus.emit('hippocampus:encoded', { id, salience });
    return id;
  }

  enqueueConsolidation(item: MemoryItem): void {
    const queue = this.stateManager.getStruct('hippocampus').consolidation_queue ?? [];
    queue.push({ ...item, type: 'consolidated' });
    this.stateManager.patch({ hippocampus: { consolidation_queue: queue } });
  }

  consolidate(): void {
    const state = this.stateManager.getStruct('hippocampus');
    const queue = state.consolidation_queue ?? [];
    const longterm = state.longterm_memory ?? [];

    const consolidated = queue.map((item: MemoryItem) => ({
      ...item,
      type: 'consolidated',
      encoded_at: Date.now(),
    }));

    this.stateManager.patch({
      hippocampus: {
        consolidation_queue: [],
        longterm_memory: [...longterm, ...consolidated],
        last_consolidation: new Date().toISOString(),
      },
    });

    this.eventBus.emit('hippocampus:consolidated', { count: consolidated.length });
  }

  recall(id: string): MemoryItem | null {
    const state = this.stateManager.getStruct('hippocampus');
    const all = [...(state.working_memory ?? []), ...(state.longterm_memory ?? [])];
    const item = all.find((m: MemoryItem) => m.id === id);
    if (item) {
      item.last_accessed = Date.now();
      this.stateManager.patch({ hippocampus: { working_memory: state.working_memory } });
    }
    return item ?? null;
  }

  clearWorking(): void {
    this.stateManager.patch({ hippocampus: { working_memory: [] } });
  }

  getWorkingMemory(): MemoryItem[] {
    return this.stateManager.getStruct('hippocampus').working_memory ?? [];
  }

  getLongtermMemory(): MemoryItem[] {
    return this.stateManager.getStruct('hippocampus').longterm_memory ?? [];
  }
}
