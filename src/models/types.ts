// 기본 타입 정의
export type ProcessType = 'producer' | 'consumer';

// ProcessStatus 타입 정의 추가
export type ProcessStatus = 'waiting' | 'running' | 'blocked' | 'finished';

export interface Process {
  id: string;
  type: ProcessType;
  name: string;
  message?: string; // 생산자의 경우 메시지 포함
// - status: 'waiting' | 'running' | 'blocked';
  status: ProcessStatus; // ProcessStatus 타입 사용
  currentStep: number;
  steps: string[];
  waitReason?: string; // 프로세스가 대기 중인 이유 (세마포어 이름)
}

export interface Message {
  id: string;
  content: string;
  producerId: string;
  producerName: string;
}

export interface ConsumerLog {
  consumerId: string;
  consumerName: string;
  messageId: string;
  messageContent: string;
  producerId: string;
  producerName: string;
  timestamp: number;
}

export interface SimulationState {
  buffer: (Message | null)[];
  in: number;
  out: number;
  mutexP: number;
  mutexC: number;
  nrfull: number;
  nrempty: number;
  mutexPQueue: Process[];
  mutexCQueue: Process[];
  nrfullQueue: Process[];
  nremptyQueue: Process[];
  processes: Process[];
  currentProcessIndex: number;
  consumerLogs: ConsumerLog[];
  step: number;
  history: SimulationState[];
  isRunning: boolean;
}
