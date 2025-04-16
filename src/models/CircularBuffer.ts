import { Message } from './types';

export class CircularBuffer {
  private buffer: (Message | null)[];
  private size: number;
  private inIndex: number;
  private outIndex: number;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Array(size).fill(null);
    this.inIndex = 0;
    this.outIndex = 0;
  }

  public getBuffer(): (Message | null)[] {
    return [...this.buffer];
  }

  public getInIndex(): number {
    return this.inIndex;
  }

  public getOutIndex(): number {
    return this.outIndex;
  }

  public insert(message: Message): void {
    this.buffer[this.inIndex] = message;
    this.inIndex = (this.inIndex + 1) % this.size;
  }

  public remove(): Message | null {
    const message = this.buffer[this.outIndex];
    this.buffer[this.outIndex] = null;
    this.outIndex = (this.outIndex + 1) % this.size;
    return message;
  }

  public reset(): void {
    this.buffer = new Array(this.size).fill(null);
    this.inIndex = 0;
    this.outIndex = 0;
  }
}
