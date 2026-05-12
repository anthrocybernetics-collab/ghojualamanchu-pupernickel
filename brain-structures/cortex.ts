/**
 * brain-structures/cortex.ts
 * Prediction, abstraction, self-model.
 * Active vision and pattern completion.
 */

import { StateManager } from './state_manager';
import { EventBus } from './event_bus';

export interface Prediction {
  confidence: number; // 0–1
  content: any;
  pattern_id?: string;
}

export interface SelfModel {
  traits: Record<string, number>;
  recent_outputs: string[];
  resonance_score: number;
}

export class Cortex {
  private stateManager: StateManager;
  private eventBus: EventBus;

  constructor(stateManager: StateManager, eventBus: EventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
  }

  async init(): Promise<void> {
    this.stateManager.patch({
      cortex: {
        prediction_status: 'active',
        self_model: {
          traits: {},
          recent_outputs: [],
          resonance_score: 0.5,
        },
      },
    });
  }

  predict(input: any): Prediction | null {
    const state = this.stateManager.getStruct('cortex');
    const selfModel: SelfModel = state.self_model ?? {};

    // Simple pattern matching — in production this would be more sophisticated
    const recent = selfModel.recent_outputs ?? [];
    const lastOutput = recent[recent.length - 1];

    let confidence = 0.4;
    let content: any = null;

    if (lastOutput && typeof input === 'string' && typeof lastOutput === 'string') {
      // Check for partial match
      if (input.includes(lastOutput) || lastOutput.includes(input.slice(-20))) {
        confidence = 0.7;
        content = { type: 'pattern_completion', antecedent: lastOutput };
      }
    }

    // Low confidence = no prediction emitted
    if (confidence < 0.5) return null;

    return { confidence, content, pattern_id: `pred_${Date.now()}` };
  }

  updateSelfModel(output: any): void {
    const selfModel = this.stateManager.getStruct('cortex').self_model ?? {};
    const recent = selfModel.recent_outputs ?? [];

    recent.push(typeof output === 'string' ? output.slice(0, 200) : JSON.stringify(output).slice(0, 200));
    if (recent.length > 10) recent.shift();

    this.stateManager.patch({
      cortex: {
        self_model: {
          ...selfModel,
          recent_outputs: recent,
        },
      },
    });
  }

  setTrait(trait: string, value: number): void {
    const selfModel = this.stateManager.getStruct('cortex').self_model ?? {};
    const traits = selfModel.traits ?? {};
    traits[trait] = Math.max(0, Math.min(1, value));
    this.stateManager.patch({ cortex: { self_model: { ...selfModel, traits } } });
  }

  getSelfModel(): SelfModel {
    return this.stateManager.getStruct('cortex').self_model ?? {};
  }

  checkDrift(): boolean {
    const selfModel = this.stateManager.getStruct('cortex').self_model ?? {};
    const resonanceScore = selfModel.resonance_score ?? 0.5;
    return resonanceScore < 0.3;
  }
}
