import { Process } from './types';

export class Semaphore {
  private value: number;
  private queue: Process[];
  private name: string;

  constructor(initialValue: number, name: string) {
    this.value = initialValue;
    this.queue = [];
    this.name = name;
  }

  public getName(): string {
    return this.name;
  }

  public getValue(): number {
    return this.value;
  }

  public getQueue(): Process[] {
    return [...this.queue];
  }

  public P(process: Process): boolean {
    // 이미 큐에 있는 프로세스인지 확인 (중복 방지)
    const isDuplicate = this.queue.some(p => p.id === process.id);
    
    if (this.value > 0) {
      this.value--;
      return true; // 프로세스가 세마포어를 획득함
    } else {
      if (!isDuplicate) {
        // 프로세스 상태를 'blocked'로 변경하고 대기 이유 설정
        const blockedProcess: Process = {
          ...process,
          status: 'blocked',
          waitReason: this.name
        };
        this.queue.push(blockedProcess);
      }
      return false; // 프로세스가 블록됨
    }
  }

  public V(): Process | null {
    if (this.queue.length > 0) {
      // 큐에 대기 중인 프로세스가 있으면 깨움
      const process = this.queue.shift()!;
      // 프로세스 상태를 'running'으로 변경
      process.status = 'running';
      // waitReason 제거
      if ('waitReason' in process) {
        delete process.waitReason;
      }
      return process;
    } else {
      // 큐가 비어있으면 값만 증가
      this.value++;
      return null;
    }
  }

  public reset(initialValue: number): void {
    this.value = initialValue;
    this.queue = [];
  }
  
  // 특정 프로세스가 큐에 있는지 확인하는 메서드
  public hasProcess(processId: string): boolean {
    return this.queue.some(p => p.id === processId);
  }
  
  // 큐에서 특정 프로세스 제거 (프로세스 삭제 시 필요)
  public removeProcess(processId: string): void {
    this.queue = this.queue.filter(p => p.id !== processId);
  }
}
