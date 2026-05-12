/**
 * brain-structures/state_manager.ts
 * Single source of truth for all brain-structure state.
 * Replaces mempalace-style JSON file persistence with a proper manager.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface GhojuState {
  organism: string;
  version: string;
  status: 'ALIVE' | 'DEAD' | 'DORMANT';
  initialized: string;
  cycle: number;
  timestamp: string;

  medulla: Record<string, any>;
  rcomplex: Record<string, any>;
  amygdala: Record<string, any>;
  hippocampus: Record<string, any>;
  cortex: Record<string, any>;
  thalamus: Record<string, any>;
  akashic: Record<string, any>;
  lethe: Record<string, any>;
  corpus: Record<string, any>;
  [key: string]: any;
}

const DEFAULT_STATE: GhojuState = {
  organism: 'ghojualamanchu',
  version: '4.0.0-PN',
  status: 'ALIVE',
  initialized: new Date().toISOString(),
  cycle: 0,
  timestamp: new Date().toISOString(),
  medulla: { heartbeat: 0, last_pulse: null, uptime_streak: 0, emergency_count: 0, system_status: 'alive' },
  rcomplex: { territory_state: {}, threat_level: 0.0 },
  amygdala: { salience_tags: {}, threat_rewards: {} },
  hippocampus: { working_memory: [], longterm_memory: [], consolidation_queue: [] },
  cortex: { prediction_status: 'active', self_model: {} },
  thalamus: { routing_table: {}, resonance_weights: {} },
  akashic: { presence_stream: [], density: 0 },
  lethe: { decay_buffer: [], forgetting_candidates: [] },
  corpus: { integration_status: 'active', balance_score: 0 },
};

export class StateManager {
  private state: GhojuState;
  private filePath: string;
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();
  private dirty: boolean = false;

  constructor(stateFile: string = './Data/state.json') {
    this.filePath = stateFile;
    this.state = { ...DEFAULT_STATE };
  }

  async init(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Load existing state or create new
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const loaded = JSON.parse(raw);
        this.state = { ...DEFAULT_STATE, ...loaded };
      } catch {
        console.warn('[state_manager] failed to load state, starting fresh');
        this.state = { ...DEFAULT_STATE };
      }
    } else {
      await this.flush();
    }
  }

  get(): Readonly<GhojuState> {
    return this.state;
  }

  patch(partial: Partial<GhojuState>): void {
    // Deep merge top-level keys
    for (const [key, value] of Object.entries(partial)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.state[key] = { ...((this.state as any)[key] ?? {}), ...value };
      } else {
        (this.state as any)[key] = value;
      }
    }
    this.state.timestamp = new Date().toISOString();
    this.state.cycle++;
    this.dirty = true;
    this.notify('patch', partial);
  }

  getStruct(structure: keyof GhojuState): any {
    return this.state[structure];
  }

  on(event: string, cb: (payload: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);
  }

  private notify(event: string, payload: any): void {
    this.listeners.get(event)?.forEach((cb) => cb(payload));
  }

  async flush(): Promise<void> {
    if (!this.dirty && fs.existsSync(this.filePath)) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
      this.dirty = false;
    } catch (err) {
      console.error('[state_manager] flush failed:', err);
    }
  }
}
