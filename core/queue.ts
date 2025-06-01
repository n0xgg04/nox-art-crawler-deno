import PQueue from "p-queue";

class DiscordQueue {
  private queue: PQueue;

  constructor() {
    this.queue = new PQueue({
      concurrency: 1,
      interval: 1000,
      intervalCap: 1,
      timeout: 30000,
      throwOnTimeout: false,
    });
  }

  async add(
    fn: () => Promise<void>,
    options: { priority?: number } = {}
  ): Promise<void> {
    return this.queue.add(fn, {
      priority: options.priority || 0,
    });
  }

  getSize(): number {
    return this.queue.size;
  }

  getPending(): number {
    return this.queue.pending;
  }

  isPaused(): boolean {
    return this.queue.isPaused;
  }

  pause(): void {
    this.queue.pause();
  }

  start(): void {
    this.queue.start();
  }

  clear(): void {
    this.queue.clear();
  }

  async onEmpty(): Promise<void> {
    return this.queue.onEmpty();
  }

  async onIdle(): Promise<void> {
    return this.queue.onIdle();
  }
}

export const discordQueue = new DiscordQueue();
