import { SimulationState, ConsumerLog } from './types';
import { Semaphore } from './Semaphore';
import { CircularBuffer } from './CircularBuffer';
import { ProcessModel } from './ProcessModel';

export class SimulationModel {
  private buffer: CircularBuffer;
  private mutexP: Semaphore;
  private mutexC: Semaphore;
  private nrfull: Semaphore;
  private nrempty: Semaphore;
  private processes: ProcessModel[];
  private currentProcessIndex: number;
  private consumerLogs: ConsumerLog[];
  private step: number;
  private history: SimulationState[];
  private isRunning: boolean;
  private bufferSize: number;
  private processesCompleted: Set<string>;
  private blockedProcesses: Map<string, { semaphore: string, nextStepIndex: number }>;
  private readyQueue: ProcessModel[];

  constructor(bufferSize: number = 4) {
    this.bufferSize = bufferSize;
    this.buffer = new CircularBuffer(bufferSize);
    this.mutexP = new Semaphore(1, 'mutexP');
    this.mutexC = new Semaphore(1, 'mutexC');
    this.nrfull = new Semaphore(0, 'nrfull');
    this.nrempty = new Semaphore(bufferSize, 'nrempty');
    this.processes = [];
    this.currentProcessIndex = 0;
    this.consumerLogs = [];
    this.step = 0;
    this.history = [];
    this.isRunning = false;
    this.processesCompleted = new Set<string>();
    this.blockedProcesses = new Map();
    this.readyQueue = [];
    
    this.saveState();
  }

  // 프로세스 추가
  public addProcess(process: ProcessModel): void {
    this.processes.push(process);
  }

  //프로세스 삭제
  public removeProcess(id: string): void {
    const index = this.processes.findIndex(p => p.getId() === id);
    if (index !== -1) {
      this.processes.splice(index, 1);
      this.blockedProcesses.delete(id);
      
      // 세마포어 큐에서도 프로세스 제거
      this.mutexP.removeProcess(id);
      this.mutexC.removeProcess(id);
      this.nrfull.removeProcess(id);
      this.nrempty.removeProcess(id);
      
      // 프로세스 인덱스 조정
      if (index <= this.currentProcessIndex && this.currentProcessIndex > 0) {
        this.currentProcessIndex--;
      } else if (this.currentProcessIndex >= this.processes.length && this.processes.length > 0) {
        this.currentProcessIndex = this.processes.length - 1;
      }
    }
  }

  // 프로세스 전체 삭제제
  public removeAllProcesses(): void {
    this.processes = [];
    this.blockedProcesses.clear();
    this.currentProcessIndex = 0;
    this.reset();
  }

  // 시뮬레이션 시작
  public start(): void {
    this.isRunning = true;
    this.processesCompleted.clear(); // 시뮬레이션 시작 시 완료 프로세스 목록 초기화
    this.blockedProcesses.clear(); // 블록된 프로세스 정보 초기화
    
    if (this.processes.length > 0) {
      this.processes[this.currentProcessIndex].setStatus('running');
    }
  }

  // 다음 상태로 이동
  public nextStep(): SimulationState | null {
    if (!this.isRunning || this.processes.length === 0) {
      return null;
    }

    let processCompletedCycle = false;
    let processBlocked = false;

    if (this.currentProcessIndex < 0 || this.currentProcessIndex >= this.processes.length) {
        this.moveToNextProcess();
        if (!this.isRunning || this.currentProcessIndex < 0 || this.currentProcessIndex >= this.processes.length) {
            this.saveState();
            return this.getCurrentState();
        }
    }

    const currentProcess = this.processes[this.currentProcessIndex];
    const currentStepDescription = currentProcess.getCurrentStepDescription();
    let isBlocked = false;

    // 현재 실행 중인 프로세스의 상태를 'running'으로 설정
    currentProcess.setStatus('running');

    // 현재 프로세스의 현재 단계 실행
    if (currentProcess.getType() === 'producer') {
      isBlocked = this.executeProducerStep(currentProcess, currentStepDescription);
    } else {
      isBlocked = this.executeConsumerStep(currentProcess, currentStepDescription);
    }

    // 프로세스가 블록된 경우
    if (isBlocked) {
      // 현재 프로세스 상태를 'blocked'로 설정
      currentProcess.setStatus('blocked');
      processBlocked = true;
    } else {
      // 프로세스가 블록되지 않은 경우 다음 단계로 이동
      if (!currentProcess.nextStep()) {
        // 현재 프로세스의 모든 단계가 완료됨
        currentProcess.setStatus('finished'); // 상태를 'finished'로 설정
        processCompletedCycle = true;
      }
    }

    // 현재 프로세스가 블록되었거나 사이클을 완료한 경우에만 다음 프로세스로 전환
    if (processBlocked || processCompletedCycle) {
        this.moveToNextProcess();
    } 

    // 모든 프로세스가 블록되었거나 대기 중이거나 완료되었고 준비 큐가 비어 있는지 확인하여 시뮬레이션 종료
    const allEffectivelyInactive = this.processes.every(p =>
        p.getStatus() === 'finished' ||
        this.blockedProcesses.has(p.getId()) ||
        this.mutexP.hasProcess(p.getId()) ||
        this.mutexC.hasProcess(p.getId()) ||
        this.nrfull.hasProcess(p.getId()) ||
        this.nrempty.hasProcess(p.getId()) ||
        p.getStatus() === 'waiting'
    );

    if (allEffectivelyInactive && this.readyQueue.length === 0 && this.processes.length > 0) {
        this.isRunning = false; // 모든 프로세스가 비활성 상태이고 준비 큐가 비어 있으면면 시뮬레이션 중지
    }

    this.step++;
    this.saveState();
    return this.getCurrentState();
  }

  private moveToNextProcess(): void {
    // 현재 프로세스가 running 상태면 waiting으로 변경
    if (this.processes.length > 0 && this.currentProcessIndex >= 0 && this.currentProcessIndex < this.processes.length && this.processes[this.currentProcessIndex].getStatus() === 'running') {
      this.processes[this.currentProcessIndex].setStatus('waiting');
    }

    // 준비 큐 확인
    if (this.readyQueue.length > 0) {
      const nextProcess = this.readyQueue.shift()!;
      const processIndex = this.processes.findIndex(p => p.getId() === nextProcess.getId());
      if (processIndex !== -1) {
        this.currentProcessIndex = processIndex;
        this.processes[this.currentProcessIndex].setStatus('running');
        return;
      }
    }
    
    // 다음 프로세스 인덱스 계산 (기존 라운드 로빈 로직)
    if (this.processes.length === 0) {
      this.isRunning = false;
      return;
    }
    
    let nextIndex = (this.currentProcessIndex + 1) % this.processes.length;
    let attempts = 0;
    
    // 블록되지 않은 프로세스를 찾을 때까지 순환
    while (attempts < this.processes.length) {
      const nextProcess = this.processes[nextIndex];
      const nextProcessId = nextProcess.getId();
      
      // 블록되지 않았고 완료되지 않은 프로세스를 찾으면 선택
      if (nextProcess.getStatus() !== 'finished' && // 완료된 프로세스 건너뛰기
          !this.blockedProcesses.has(nextProcessId) && 
          !this.mutexP.hasProcess(nextProcessId) && 
          !this.mutexC.hasProcess(nextProcessId) && 
          !this.nrfull.hasProcess(nextProcessId) && 
          !this.nrempty.hasProcess(nextProcessId)) {
        this.currentProcessIndex = nextIndex;
        this.processes[this.currentProcessIndex].setStatus('running');
        return;
      }
      
      nextIndex = (nextIndex + 1) % this.processes.length;
      attempts++;
    }
    
    // 모든 프로세스가 블록된 경우 또는 실행 가능한 프로세스가 없는 경우
    const allInactive = this.processes.every(p => 
        p.getStatus() === 'finished' || // 완료된 프로세스 포함
        this.blockedProcesses.has(p.getId()) || 
        this.mutexP.hasProcess(p.getId()) || 
        this.mutexC.hasProcess(p.getId()) || 
        this.nrfull.hasProcess(p.getId()) || 
        this.nrempty.hasProcess(p.getId())
    );

    if (allInactive && this.processes.length > 0) {
        this.isRunning = false; // 모든 프로세스가 블록되거나 완료되면 시뮬레이션 중지
    }
  }

  // 시뮬레이션 초기화
  public reset(): void {
    this.buffer = new CircularBuffer(this.bufferSize);
    this.mutexP = new Semaphore(1, 'mutexP');
    this.mutexC = new Semaphore(1, 'mutexC');
    this.nrfull = new Semaphore(0, 'nrfull');
    this.nrempty = new Semaphore(this.bufferSize, 'nrempty');
    this.currentProcessIndex = 0;
    this.consumerLogs = [];
    this.step = 0;
    this.history = [];
    this.isRunning = false;
    this.processesCompleted.clear();
    this.blockedProcesses.clear();
    this.readyQueue = [];

    for (const process of this.processes) {
      process.resetSteps();
      process.setStatus('waiting');
    }
    
    this.saveState();
  }

  public getCurrentState(): SimulationState {
    return {
      buffer: this.buffer.getBuffer(),
      in: this.buffer.getInIndex(),
      out: this.buffer.getOutIndex(),
      mutexP: this.mutexP.getValue(),
      mutexC: this.mutexC.getValue(),
      nrfull: this.nrfull.getValue(),
      nrempty: this.nrempty.getValue(),
      mutexPQueue: this.mutexP.getQueue(),
      mutexCQueue: this.mutexC.getQueue(),
      nrfullQueue: this.nrfull.getQueue(),
      nremptyQueue: this.nrempty.getQueue(),
      processes: this.processes.map(p => {
        const process = p.toJSON();
        if (process.status === 'blocked') {
          const blockInfo = this.blockedProcesses.get(process.id);
          if (blockInfo) {
            process.waitReason = blockInfo.semaphore;
          }
        }
        return process;
      }),
      currentProcessIndex: this.currentProcessIndex,
      consumerLogs: [...this.consumerLogs],
      step: this.step,
      history: [],
      isRunning: this.isRunning
    };
  }

  // 세마포어 큐에서 프로세스가 깨어났을 때 호출
  private wakeUpProcess(processId: string): void {
    const blockInfo = this.blockedProcesses.get(processId);
    if (!blockInfo) return;
    
    this.blockedProcesses.delete(processId);
    
    const processIndex = this.processes.findIndex(p => p.getId() === processId);
    if (processIndex === -1) return;
    
    const process = this.processes[processIndex];
    
    // 프로세스 상태 업데이트 (waiting으로 설정)
    process.setStatus('waiting'); 
    
    // 깨어난 프로세스의 다음 실행 단계를 설정 (P() 연산 다음 단계)
    process.setNextStep(blockInfo.nextStepIndex);

    // 준비 큐에 추가
    if (!this.readyQueue.some(p => p.getId() === processId)) {
        this.readyQueue.push(process);
    }
  }

  private executeProducerStep(process: ProcessModel, stepDescription: string): boolean {
    const processId = process.getId();
    
    switch (stepDescription) {
      // 메시지 생성 단계는 실제 작업 없음
      case 'create a new message M':
        return false;
        
      case 'P(mutexP)':
        const mutexPResult = this.mutexP.P(process.toJSON());
        if (!mutexPResult) {
          // 프로세스가 블록됨
          this.blockedProcesses.set(processId, { 
            semaphore: 'mutexP', 
            nextStepIndex: process.getCurrentStep() + 1 // 다음 단계 인덱스 저장
          });
          return true;
        }
        return false;
        
      case 'P(nrempty)':
        const nremptyResult = this.nrempty.P(process.toJSON());
        if (!nremptyResult) {
          // 프로세스가 블록됨
          this.blockedProcesses.set(processId, { 
            semaphore: 'nrempty', 
            nextStepIndex: process.getCurrentStep() + 1 // 다음 단계 인덱스 저장
          });
          return true;
        }
        return false;
        
      case 'buffer[in] <- M':
        const message = process.createMessage();
        this.buffer.insert(message);
        return false;
        
      case 'in <- (in + 1) mod N':
        // CircularBuffer 클래스에서 이미 처리됨
        return false;
        
      case 'V(nrfull)':
        const releasedProcess1 = this.nrfull.V();
        if (releasedProcess1) {
          this.wakeUpProcess(releasedProcess1.id);
        }
        return false;
        
      case 'V(mutexP)':
        const releasedProcess2 = this.mutexP.V();
        if (releasedProcess2) {
          this.wakeUpProcess(releasedProcess2.id);
        }
        return false;
        
      default:
        return false;
    }
  }

  private executeConsumerStep(process: ProcessModel, stepDescription: string): boolean {
    const processId = process.getId();
    
    switch (stepDescription) {
      case 'P(mutexC)':
        const mutexCResult = this.mutexC.P(process.toJSON());
        if (!mutexCResult) {
          this.blockedProcesses.set(processId, { 
            semaphore: 'mutexC', 
            nextStepIndex: process.getCurrentStep() + 1 // 다음 단계 인덱스 저장
          });
          return true;
        }
        return false;
        
      case 'P(nrfull)':
        const nrfullResult = this.nrfull.P(process.toJSON());
        if (!nrfullResult) {
          this.blockedProcesses.set(processId, { 
            semaphore: 'nrfull', 
            nextStepIndex: process.getCurrentStep() + 1 // 다음 단계 인덱스 저장
          });
          return true;
        }
        return false;
        
      case 'm <- buffer[out]':
        const message = this.buffer.getBuffer()[this.buffer.getOutIndex()];
        if (message) {
          this.consumerLogs.push({
            consumerId: process.getId(),
            consumerName: process.getName(),
            messageId: message.id,
            messageContent: message.content,
            producerId: message.producerId,
            producerName: message.producerName,
            timestamp: Date.now()
          });
        }
        return false;
        
      case 'out <- (out + 1) mod N':
        this.buffer.remove();
        return false;
        
      case 'V(nrempty)':
        const releasedProcessnrempty = this.nrempty.V();
        if (releasedProcessnrempty) {
          this.wakeUpProcess(releasedProcessnrempty.id);
        }
        return false;
        
      case 'V(mutexC)':
        const releasedProcessmutexC = this.mutexC.V();
        if (releasedProcessmutexC) {
          this.wakeUpProcess(releasedProcessmutexC.id);
        }
        return false;
        
      default:
        return false;
    }
  }

  private saveState(): void {
    const currentState = this.getCurrentState();
    this.history.push(currentState);
  }
  
  // 프로세서 예시 초기화 함수
  public initializeExample(): void {
    this.removeAllProcesses();
    
    // 생산자 – 소비자 – 소비자 – 소비자 - 생산자 – 생산자 – 생산자 – 생산자 – 생산자 – 생산자 – 생산자 – 
    // 생산자 – 생산자 – 소비자 – 생산자 – 생산자 – 생산자 – 생산자 – 소비자 – 소비자 – 소비자 – 소비자 – 소비자 – 소비자 - 소비자
    const processTypes = [
      'producer', 'consumer', 'consumer', 'consumer', 'producer', 
      'producer', 'producer', 'producer', 'producer', 'producer', 
      'producer', 'producer', 'consumer', 'producer', 'producer', 
      'producer', 'consumer', 'consumer', 'consumer', 'consumer', 
      'consumer', 'consumer', 'consumer', 'consumer'
    ];
    
    let producerCount = 0;
    let consumerCount = 0;
    
    for (const type of processTypes) {
      if (type === 'producer') {
        producerCount++;
        const name = `P${producerCount}`;
        const message = `메시지 ${producerCount}`;
        const process = new ProcessModel('producer', name, message);
        this.addProcess(process);
      } else {
        consumerCount++;
        const name = `C${consumerCount}`;
        const process = new ProcessModel('consumer', name);
        this.addProcess(process);
      }
    }
    
    this.reset();
  }
}
