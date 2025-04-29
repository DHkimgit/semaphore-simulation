import { Process, ProcessType, Message, ProcessStatus } from './types'; // Import ProcessStatus
import { v4 as uuidv4 } from 'uuid';

export class ProcessModel {
  private id: string;
  private type: ProcessType;
  private name: string;
  private message?: string;
  private status: ProcessStatus; // Use ProcessStatus type
  private currentStep: number;
  private steps: string[];

  constructor(type: ProcessType, name: string, message?: string) {
    this.id = uuidv4();
    this.type = type;
    this.name = name;
    this.message = message;
    this.status = 'waiting';
    this.currentStep = 0;
    
    // 프로세스 타입에 따른 단계 설정
    if (type === 'producer') {
      this.steps = [
        'create a new message M',
        'P(mutexP)',
        'P(nrempty)',
        'buffer[in] <- M',
        'in <- (in + 1) mod N',
        'V(nrfull)',
        'V(mutexP)'
      ];
    } else {
      // 소비자 알고리즘 수정: P(mutexP) -> P(mutexC)
      this.steps = [
        'P(mutexC)',
        'P(nrfull)',
        'm <- buffer[out]',
        'out <- (out + 1) mod N',
        'V(nrempty)',
        'V(mutexC)'
      ];
    }
  }

  public getId(): string {
    return this.id;
  }

  public getType(): ProcessType {
    return this.type;
  }

  public getName(): string {
    return this.name;
  }

  public getMessage(): string | undefined {
    return this.message;
  }

  public getStatus(): ProcessStatus { // Use ProcessStatus type
    return this.status;
  }

  public setStatus(status: ProcessStatus): void { // Use ProcessStatus type
    this.status = status;
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public getCurrentStepDescription(): string {
    return this.steps[this.currentStep];
  }

  // Add this new method
  public setNextStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.currentStep = stepIndex;
    } else {
      console.warn(`Invalid step index: ${stepIndex} for process ${this.id}`);
      // Optionally handle the error, e.g., reset to 0 or throw an error
      // For now, we'll just keep the current step
    }
  }

  public getSteps(): string[] {
    return [...this.steps];
  }

  public nextStep(): boolean {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      return true;
    }
    return false;
  }

  public resetSteps(): void {
    this.currentStep = 0;
  }

  public createMessage(): Message {
    if (this.type !== 'producer') {
      throw new Error('Only producer can create message');
    }
    
    return {
      id: uuidv4(),
      content: this.message || `Message from ${this.name}`,
      producerId: this.id,
      producerName: this.name
    };
  }

  public toJSON(): Process {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      message: this.message,
      status: this.status,
      currentStep: this.currentStep,
      steps: [...this.steps]
    };
  }
}
