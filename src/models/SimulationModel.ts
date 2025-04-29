import { SimulationState, Process, Message, ConsumerLog, ProcessStatus } from './types';
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
  private processesCompleted: Set<string>; // 코드를 한 번 실행한 프로세스 추적
  private blockedProcesses: Map<string, { semaphore: string, nextStepIndex: number }>; // 블록된 프로세스 정보
  private readyQueue: ProcessModel[]; // 깨어난 프로세스를 위한 준비 큐

  constructor(bufferSize: number = 4) {
    this.bufferSize = bufferSize;
    this.buffer = new CircularBuffer(bufferSize);
    this.mutexP = new Semaphore(1, 'mutexP');
    this.mutexC = new Semaphore(1, 'mutexC'); // 0에서 1로 변경
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
    this.readyQueue = []; // 준비 큐 초기화
    
    // 초기 상태 저장
    this.saveState();
  }

  public addProcess(process: ProcessModel): void {
    this.processes.push(process);
  }

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
      
      // 현재 프로세스 인덱스 조정
      if (index <= this.currentProcessIndex && this.currentProcessIndex > 0) {
        this.currentProcessIndex--;
      } else if (this.currentProcessIndex >= this.processes.length && this.processes.length > 0) {
        this.currentProcessIndex = this.processes.length - 1;
      }
    }
  }

  public removeAllProcesses(): void {
    this.processes = [];
    this.blockedProcesses.clear();
    this.currentProcessIndex = 0;
    this.reset();
  }

  public reorderProcesses(orderedIds: string[]): void {
    const newOrder: ProcessModel[] = [];
    
    for (const id of orderedIds) {
      const process = this.processes.find(p => p.getId() === id);
      if (process) {
        newOrder.push(process);
      }
    }
    
    if (newOrder.length === this.processes.length) {
      this.processes = newOrder;
    }
  }

  public start(): void {
    this.isRunning = true;
    this.processesCompleted.clear(); // 시뮬레이션 시작 시 완료 프로세스 목록 초기화
    this.blockedProcesses.clear(); // 블록된 프로세스 정보 초기화
    
    if (this.processes.length > 0) {
      this.processes[this.currentProcessIndex].setStatus('running');
    }
  }

  public nextStep(): SimulationState | null {
    if (!this.isRunning || this.processes.length === 0) {
      return null;
    }

    let processCompletedCycle = false;
    let processBlocked = false;

    // Check if there's a valid current process
    if (this.currentProcessIndex < 0 || this.currentProcessIndex >= this.processes.length) {
        // No active process, try to find one
        this.moveToNextProcess();
        // If still no active process, return
        if (!this.isRunning || this.currentProcessIndex < 0 || this.currentProcessIndex >= this.processes.length) {
            this.saveState(); // Save state even if nothing happened
            return this.getCurrentState();
        }
    }

    const currentProcess = this.processes[this.currentProcessIndex];
    const currentStepDescription = currentProcess.getCurrentStepDescription();
    let isBlocked = false;

    // Set status to running before executing the step
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
        // currentProcess.resetSteps(); // 더 이상 필요 없음
        currentProcess.setStatus('finished'); // 상태를 'finished'로 설정
        processCompletedCycle = true;
      } else {
         // Successfully moved to the next step, keep status as 'running' for now
         // It will be set to 'waiting' in moveToNextProcess if we switch
      }
    }

    // 현재 프로세스가 블록되었거나 사이클을 완료한 경우에만 다음 프로세스로 전환
    if (processBlocked || processCompletedCycle) {
        // Set current process to waiting *before* moving to the next,
        // unless it was blocked (already set)
        // Status is already set correctly above (blocked or waiting)
        this.moveToNextProcess();
    } else {
        // If the process was not blocked and did not complete its cycle,
        // it remains the current running process for the next step.
        // Its status should remain 'running' (set at the start).
    }

    // 모든 프로세스가 블록되었거나 대기 중이거나 완료되었고 준비 큐가 비어 있는지 확인하여 시뮬레이션 종료
    const allEffectivelyInactive = this.processes.every(p =>
        p.getStatus() === 'finished' || // 완료된 프로세스 포함
        this.blockedProcesses.has(p.getId()) ||
        this.mutexP.hasProcess(p.getId()) ||
        this.mutexC.hasProcess(p.getId()) ||
        this.nrfull.hasProcess(p.getId()) ||
        this.nrempty.hasProcess(p.getId()) ||
        p.getStatus() === 'waiting' // Also consider waiting processes if none are ready
    );

    if (allEffectivelyInactive && this.readyQueue.length === 0 && this.processes.length > 0) {
        this.isRunning = false; // 모든 프로세스가 비활성 상태이고 준비 큐가 비면 시뮬레이션 중지
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
    // isRunning 상태는 nextStep에서 관리되므로 여기서는 변경하지 않음
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

  public previousStep(): SimulationState | null {
    if (this.history.length <= 1) {
      return null;
    }
    
    // 현재 상태 제거
    this.history.pop();
    
    // 이전 상태 복원
    const previousState = this.history[this.history.length - 1];
    this.restoreState(previousState);
    
    return this.getCurrentState();
  }

  public reset(): void {
    this.buffer = new CircularBuffer(this.bufferSize);
    this.mutexP = new Semaphore(1, 'mutexP');
    this.mutexC = new Semaphore(1, 'mutexC'); // 0에서 1로 변경
    this.nrfull = new Semaphore(0, 'nrfull');
    this.nrempty = new Semaphore(this.bufferSize, 'nrempty');
    this.currentProcessIndex = 0;
    this.consumerLogs = [];
    this.step = 0;
    this.history = [];
    this.isRunning = false;
    this.processesCompleted.clear();
    this.blockedProcesses.clear();
    this.readyQueue = []; // 준비 큐 초기화
    
    // 모든 프로세스 초기화
    for (const process of this.processes) {
      process.resetSteps(); // resetSteps는 유지하여 단계 초기화
      process.setStatus('waiting'); // 모든 프로세스를 waiting으로 초기화
    }
    
    // 초기 상태 저장
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
        // 대기 이유 추가
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
      history: [],  // 히스토리는 상태에 포함하지 않음
      isRunning: this.isRunning
    };
  }

  // 세마포어 큐에서 프로세스가 깨어났을 때 호출
  private wakeUpProcess(processId: string): void {
    const blockInfo = this.blockedProcesses.get(processId);
    if (!blockInfo) return;
    
    // 블록된 프로세스 정보 삭제
    this.blockedProcesses.delete(processId);
    
    // 프로세스 찾기
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
      case 'create a new message M':
        // 메시지 생성 단계는 실제 작업 없음
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
      // 소비자 알고리즘 수정: P(mutexP) -> P(mutexC)
      case 'P(mutexC)':
        const mutexCResult = this.mutexC.P(process.toJSON());
        if (!mutexCResult) {
          // 프로세스가 블록됨
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
          // 프로세스가 블록됨
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
        const releasedProcess1 = this.nrempty.V();
        if (releasedProcess1) {
          this.wakeUpProcess(releasedProcess1.id);
        }
        return false;
        
      case 'V(mutexC)':
        const releasedProcess2 = this.mutexC.V();
        if (releasedProcess2) {
          this.wakeUpProcess(releasedProcess2.id);
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

  private restoreState(state: SimulationState): void {
    // 버퍼 상태 복원
    this.buffer = new CircularBuffer(this.bufferSize);
    for (let i = 0; i < state.buffer.length; i++) {
      if (state.buffer[i]) {
        this.buffer.insert(state.buffer[i]!);
      }
    }
    
    // 세마포어 상태 복원
    this.mutexP = new Semaphore(state.mutexP, 'mutexP');
    this.mutexC = new Semaphore(state.mutexC, 'mutexC');
    this.nrfull = new Semaphore(state.nrfull, 'nrfull');
    this.nrempty = new Semaphore(state.nrempty, 'nrempty');
    
    // 세마포어 큐 복원
    state.mutexPQueue.forEach(p => this.mutexP.P(p));
    state.mutexCQueue.forEach(p => this.mutexC.P(p));
    state.nrfullQueue.forEach(p => this.nrfull.P(p));
    state.nremptyQueue.forEach(p => this.nrempty.P(p));
    
    // 블록된 프로세스 정보 초기화
    this.blockedProcesses.clear();
    
    // 프로세스 상태 복원
    for (let i = 0; i < this.processes.length; i++) {
      const processState = state.processes.find(p => p.id === this.processes[i].getId());
      if (processState) {
        this.processes[i].setStatus(processState.status as ProcessStatus); // 타입 단언 추가
        
        // 블록된 프로세스 정보 복원
        if (processState.status === 'blocked' && processState.waitReason) {
          this.blockedProcesses.set(processState.id, {
            semaphore: processState.waitReason,
            // nextStepIndex: processState.currentStep + 1 // 이전 로직
            nextStepIndex: processState.currentStep // 복원 시에는 저장된 currentStep을 사용해야 함 (P() 다음 단계가 아님)
          });
        }
        
        // 현재 단계 복원
        // restoreState에서는 ProcessModel의 currentStep을 직접 설정하지 않고,
        // processState.currentStep 값과 일치할 때까지 nextStep()을 호출하는 방식이므로
        // setNextStep을 사용할 필요가 없습니다. 기존 로직 유지.
        // 단, finished 상태일 경우 step을 진행시키지 않도록 처리
        if (this.processes[i].getStatus() !== 'finished') {
            while (this.processes[i].getCurrentStep() !== processState.currentStep) {
              // nextStep()은 마지막 단계 이후 false를 반환하므로 무한 루프 방지
              if (!this.processes[i].nextStep()) break; 
            }
        }
      }
    }
    
    this.currentProcessIndex = state.currentProcessIndex;
    this.consumerLogs = [...state.consumerLogs];
    this.step = state.step;
    this.isRunning = state.isRunning;
  }
  
  // 예시 초기화 함수
  public initializeExample(): void {
    this.removeAllProcesses();
    
    // 생산자 – 소비자 – 소비자 – 소비자 - 생산자 – 생산자 – 생산자 – 생산자 – 생산자 – 생산자 – 생산자 – 생산자 – 생산자 – 소비자 – 생산자 – 생산자 – 생산자 – 생산자 – 소비자 – 소비자 – 소비자 – 소비자 – 소비자 – 소비자 - 소비자
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
