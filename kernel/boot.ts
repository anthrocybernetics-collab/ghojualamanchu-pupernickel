/**
 * kernel/boot.ts
 * Priority boot sequence for Ghojualamanchu Pumpernickel
 *
 * Boot order: state_manager → event_bus → medulla → thalamus
 */

import { StateManager } from '../brain-structures/state_manager';
import { EventBus } from '../brain-structures/event_bus';
import { Medulla } from '../brain-structures/medulla';
import { Thalamus } from '../brain-structures/thalamus';

export interface BootResult {
  success: boolean;
  stateManager: StateManager | null;
  eventBus: EventBus | null;
  medulla: Medulla | null;
  thalamus: Thalamus | null;
  error?: string;
}

export async function boot(kernelConfig?: {
  stateFile?: string;
  heartbeatHz?: number;
}): Promise<BootResult> {
  const result: BootResult = {
    success: false,
    stateManager: null,
    eventBus: null,
    medulla: null,
    thalamus: null,
  };

  try {
    // 1. State Manager — must be first
    result.stateManager = new StateManager(kernelConfig?.stateFile);
    await result.stateManager.init();
    console.log('[boot] state_manager: OK');

    // 2. Event Bus — needs state manager reference
    result.eventBus = new EventBus(result.stateManager);
    await result.eventBus.init();
    console.log('[boot] event_bus: OK');

    // 3. Medulla — alive check, emergency detection
    result.medulla = new Medulla(result.stateManager, result.eventBus);
    await result.medulla.init();
    console.log('[boot] medulla: OK');

    // 4. Thalamus — routes all inputs, final boot gate
    result.thalamus = new Thalamus(result.stateManager, result.eventBus);
    await result.thalamus.init();
    console.log('[boot] thalamus: OK');

    result.success = true;
    console.log('[boot] full boot complete');
    return result;

  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    console.error('[boot] FAIL:', result.error);
    return result;
  }
}
