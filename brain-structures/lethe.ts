/**
 * brain-structures/lethe.ts
 * Absence hemisphere — what ISN'T, what is fading.
 * Decay buffer, semantic pruning.
 *
 * failure_if_missing: context_pollution, identity_drift,
 *                     overaccumulation, salience_saturation
 */

import { StateManager } from './state_manager';
import { EventBus } from './event_bus';

export interface DecayCandidate {
  id: string;
  content: any;
  age_ms: number;
  salience: number; // low salience = decay first
  decay_score: number;
}

const MAX_DECAY_BUFFER = 16;

export class Lethe {
  private stateManager: StateManager;
  private eventBus: EventBus;

  constructor(stateManager: StateManager, eventBus: EventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
  }

  async init(): Promise<void> {
    this.stateManager.patch({
      lethe: {
        decay_buffer: [],
        forgetting_candidates: [],
      },
    });

    // Subscribe to hippocampus consolidations — those go into Lethe
    this.eventBus.on('hippocampus:consolidated', (payload) => {
      this.receiveFromHippocampus(payload);
    });
  }

  receiveFromHippocampus(payload: any): void {
    const decayBuffer = this.stateManager.getStruct('lethe').decay_buffer ?? [];
    const items: DecayCandidate[] = (payload.items ?? []).map((item: any) => ({
      id: item.id,
      content: item.content,
      age_ms: 0,
      salience: item.salience ?? 0.5,
      decay_score: this.computeDecayScore(item),
    }));

    const merged = [...items, ...decayBuffer]
      .sort((a, b) => b.decay_score - a.decay_score)
      .slice(0, MAX_DECAY_BUFFER);

    this.stateManager.patch({ lethe: { decay_buffer: merged } });
  }

  private computeDecayScore(item: any): number {
    // Low salience + age = high decay priority
    const salienceComponent = 1 - (item.salience ?? 0.5);
    const ageComponent = Math.min(1, (Date.now() - (item.encoded_at ?? Date.now())) / (1000 * 60 * 60)); // hours
    return salienceComponent * 0.6 + ageComponent * 0.4;
  }

  forget(id: string): void {
    const decayBuffer = this.stateManager.getStruct('lethe').decay_buffer ?? [];
    const filtered = decayBuffer.filter((d: DecayCandidate) => d.id !== id);
    this.stateManager.patch({ lethe: { decay_buffer: filtered } });
    this.eventBus.emit('lethe:forgotten', { id });
  }

  markForgotten(id: string): void {
    const candidates = this.stateManager.getStruct('lethe').forgetting_candidates ?? [];
    if (!candidates.includes(id)) {
      candidates.push(id);
      this.stateManager.patch({ lethe: { forgetting_candidates: candidates } });
    }
  }

  tick(): void {
    // Age all decay candidates
    const decayBuffer = this.stateManager.getStruct('lethe').decay_buffer ?? [];
    const aged = decayBuffer.map((d: DecayCandidate) => ({
      ...d,
      age_ms: d.age_ms + 127.7, // one heartbeat
      decay_score: this.computeDecayScore(d),
    }));

    const sorted = aged.sort((a, b) => b.decay_score - a.decay_score);

    // Auto-forget anything over threshold
    const toForget = sorted.filter((d) => d.decay_score > 0.9);
    toForget.forEach((d) => this.forget(d.id));

    const remaining = sorted.filter((d) => d.decay_score <= 0.9);
    this.stateManager.patch({ lethe: { decay_buffer: remaining } });

    if (toForget.length > 0) {
      this.eventBus.emit('lethe:batch_forgotten', { count: toForget.length });
    }
  }

  getDecayBuffer(): DecayCandidate[] {
    return this.stateManager.getStruct('lethe').decay_buffer ?? [];
  }

  isSaturated(): boolean {
    return (this.stateManager.getStruct('lethe').decay_buffer ?? []).length >= MAX_DECAY_BUFFER;
  }
}
