export type ProcessType = 'producer' | 'consumer';

export type ProcessStatus = 'waiting' | 'running' | 'blocked' | 'finished';

export interface Process {
  id: string;
  type: ProcessType;
  name: string;
  message?: string;
  status: ProcessStatus;
  currentStep: number;
  steps: string[];
  waitReason?: string;
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
