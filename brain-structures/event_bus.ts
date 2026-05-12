/**
 * brain-structures/event_bus.ts
 * Simple pub/sub event bus for inter-structure communication.
 * All structures communicate exclusively through here.
 */

import { StateManager } from './state_manager';

export type EventHandler = (payload: any) => void | Promise<void>;

export class EventBus {
  private stateManager: StateManager;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private closed: boolean = false;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  async init(): Promise<void> {
    // No async setup needed
  }

  on(event: string, handler: EventHandler): void {
    if (this.closed) return;
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  async emit(event: string, payload: any): Promise<void> {
    if (this.closed) return;
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[event_bus] handler error on ${event}:`, err);
      }
    }
  }

  async emitSync(event: string, payload: any): Promise<void> {
    // Synchronous version for shutdown
    await this.emit(event, payload);
  }

  async emitTo(targetStruct: string, event: string, payload: any): Promise<void> {
    await this.emit(`${targetStruct}:${event}`, payload);
  }

  onStruct(targetStruct: string, event: string, handler: EventHandler): void {
    this.on(`${targetStruct}:${event}`, handler);
  }

  close(): void {
    this.closed = true;
    this.handlers.clear();
  }
}
