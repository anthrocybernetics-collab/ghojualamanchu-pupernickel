/**
 * kernel/heartbeat.ts
 * 7.83 Hz heartbeat using monotonic clock source
 * Period: 127.7ms per beat
 */

import { StateManager } from '../brain-structures/state_manager';
import { EventBus } from '../brain-structures/event_bus';

const HEARTBEAT_HZ = 7.83;
const PERIOD_MS = 1000 / HEARTBEAT_HZ; // ~127.7ms

export interface HeartbeatConfig {
  hz?: number;
  onBeat?: (beatNumber: number, elapsed: number) => void;
  onEmergency?: (reason: string) => void;
}

export class Heartbeat {
  private stateManager: StateManager;
  private eventBus: EventBus;
  private beatNumber: number = 0;
  private running: boolean = false;
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private lastBeatTime: number = 0;
  private config: Required<HeartbeatConfig>;

  constructor(
    stateManager: StateManager,
    eventBus: EventBus,
    config: HeartbeatConfig = {}
  ) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.config = {
      hz: config.hz ?? HEARTBEAT_HZ,
      onBeat: config.onBeat ?? (() => {}),
      onEmergency: config.onEmergency ?? ((_) => {}),
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastBeatTime = performance.now();

    this.timerHandle = setInterval(() => {
      this.beat();
    }, PERIOD_MS);

    this.stateManager.patch({ medulla: { heartbeat: this.beatNumber } });
  }

  stop(): void {
    this.running = false;
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private beat(): void {
    this.beatNumber++;
    const now = performance.now();
    const elapsed = now - this.lastBeatTime;
    this.lastBeatTime = now;

    // Emit beat event
    this.eventBus.emit('heartbeat', {
      beatNumber: this.beatNumber,
      elapsed,
      timestamp: Date.now(),
    });

    // Check medulla health
    const state = this.stateManager.get();
    if (this.checkEmergency(state)) {
      this.config.onEmergency('medulla_heartbeat_missed');
      this.eventBus.emit('emergency', { reason: 'medulla_missed', beat: this.beatNumber });
    }

    // Update state
    this.stateManager.patch({
      medulla: {
        heartbeat: this.beatNumber,
        last_pulse: new Date().toISOString(),
        uptime_streak: this.beatNumber,
      },
    });

    this.config.onBeat(this.beatNumber, elapsed);
  }

  private checkEmergency(state: any): boolean {
    // If last pulse is older than 3 beats (3 * 127.7ms = ~383ms), something is wrong
    if (!state?.medulla?.last_pulse) return false;
    const last = new Date(state.medulla.last_pulse).getTime();
    const now = Date.now();
    return now - last > PERIOD_MS * 3;
  }

  getBeatNumber(): number {
    return this.beatNumber;
  }

  isRunning(): boolean {
    return this.running;
  }
}
