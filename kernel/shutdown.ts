/**
 * kernel/shutdown.ts
 * Clean exit — flushes state and stops all structures
 */

import { StateManager } from '../brain-structures/state_manager';
import { EventBus } from '../brain-structures/event_bus';

export interface ShutdownResult {
  success: boolean;
  flushedState: boolean;
  error?: string;
}

export async function shutdown(
  stateManager: StateManager,
  eventBus: EventBus
): Promise<ShutdownResult> {
  const result: ShutdownResult = { success: false, flushedState: false };

  try {
    // 1. Emit shutdown signal to all structures
    await eventBus.emitSync('shutdown', { timestamp: Date.now() });

    // 2. Flush state to disk
    await stateManager.flush();
    result.flushedState = true;

    // 3. Close event bus
    eventBus.close();

    result.success = true;
    console.log('[shutdown] clean exit complete');
    return result;

  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    console.error('[shutdown] error:', result.error);
    return result;
  }
}
