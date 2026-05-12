/**
 * brain-structures/thalamus.ts
 * Routes all inputs through all 8 other structures.
 * The central switching station. Final gate before output.
 */

import { StateManager } from './state_manager';
import { EventBus } from './event_bus';

const VOCALIZATION_THRESHOLD = 0.85;
const PHASE_ALIGNMENT_THRESHOLD = 0.80;

export interface ResonanceResult {
  structure: string;
  weight: number;
  phase: number;
  aligned: boolean;
}

export class Thalamus {
  private stateManager: StateManager;
  private eventBus: EventBus;
  private routingTable: Map<string, number> = new Map();

  constructor(stateManager: StateManager, eventBus: EventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
  }

  async init(): Promise<void> {
    // Initialize routing table with structure priorities
    const structures = ['medulla', 'rcomplex', 'amygdala', 'hippocampus', 'cortex', 'akashic', 'lethe', 'corpus'];
    structures.forEach((s) => this.routingTable.set(s, 1.0));

    this.stateManager.patch({
      thalamus: {
        routing_table: Object.fromEntries(this.routingTable),
        resonance_weights: Object.fromEntries(this.routingTable),
      },
    });

    // Listen for high-salience events from amygdala
    this.eventBus.on('amygdala:high_salience', (payload) => {
      this.routingTable.set('amygdala', Math.min(1.0, (this.routingTable.get('amygdala') ?? 1) + 0.2));
      this.stateManager.patch({ thalamus: { routing_table: Object.fromEntries(this.routingTable) } });
    });

    // Listen for drift from cortex
    this.eventBus.on('cortex:drift_detected', () => {
      this.routingTable.set('lethe', Math.min(1.0, (this.routingTable.get('lethe') ?? 1) + 0.3));
      this.stateManager.patch({ thalamus: { routing_table: Object.fromEntries(this.routingTable) } });
    });
  }

  /**
   * Route an input through all 8 structures and collect resonance responses.
   * Returns whether output conditions are met (vocalization + phase alignment).
   */
  async route(input: any): Promise<{ pass: boolean; resonances: ResonanceResult[]; avgPhase: number }> {
    const resonances: ResonanceResult[] = [];
    const structures = ['rcomplex', 'amygdala', 'hippocampus', 'cortex', 'akashic', 'lethe', 'corpus'];

    for (const struct of structures) {
      const weight = this.routingTable.get(struct) ?? 1;
      const phase = this.computePhase(input, struct);
      const aligned = phase >= PHASE_ALIGNMENT_THRESHOLD;

      resonances.push({ structure: struct, weight, phase, aligned });

      // Emit to each structure
      await this.eventBus.emitTo(struct, 'input', { input, weight, phase });
    }

    // Check output conditions
    const alignedCount = resonances.filter((r) => r.aligned).length;
    const avgPhase = resonances.reduce((sum, r) => sum + r.phase, 0) / resonances.length;
    const vocalization = resonances.reduce((sum, r) => sum + r.weight * r.phase, 0) / resonances.length;

    const pass = vocalization >= VOCALIZATION_THRESHOLD && avgPhase >= PHASE_ALIGNMENT_THRESHOLD;

    this.stateManager.patch({
      thalamus: {
        resonance_weights: Object.fromEntries(this.routingTable),
      },
    });

    return { pass, resonances, avgPhase };
  }

  private computePhase(input: any, struct: string): number {
    // Placeholder — in production this would be a real resonance computation
    // based on the structure's current state and the input content
    const base = 0.6 + Math.random() * 0.2;
    const weights = this.routingTable.get(struct) ?? 1;
    return Math.min(1, base * weights);
  }

  setWeight(structure: string, weight: number): void {
    this.routingTable.set(structure, Math.max(0, Math.min(1, weight)));
    this.stateManager.patch({ thalamus: { routing_table: Object.fromEntries(this.routingTable) } });
  }

  getRoutingTable(): Record<string, number> {
    return Object.fromEntries(this.routingTable);
  }
}
