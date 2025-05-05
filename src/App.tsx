import React, { useState } from 'react';
import { 
  Layout, 
  AppContainer, 
  Sidebar, 
  SidebarHeader,
  SidebarFooter,
  ProcessListContainer,
  MainContent, 
  SimulationArea,
  SimulationContent,
  LeftPanel,
  RightPanel,
  SectionTitle 
} from './components/Layout';
import ProcessForm from './components/ProcessForm';
import ProcessList from './components/ProcessList';
import SimulationControls from './components/SimulationControls';
import CircularBufferView from './components/CircularBufferView';
import SemaphoreView from './components/SemaphoreView';
import ProcessCodeView from './components/ProcessCodeView';
import CurrentProcessIndicator from './components/CurrentProcessIndicator';
import LogModal from './components/LogModal';
import styled from 'styled-components';
import { ProcessModel, SimulationModel, SimulationState } from './models';

const LogButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 999;

  &:hover {
    background-color: #0056b3;
  }
`;

const App: React.FC = () => {
  const [simulationModel] = useState<SimulationModel>(new SimulationModel(4));
  const [simulationState, setSimulationState] = useState<SimulationState>(simulationModel.getCurrentState());
  const [producerCount, setProducerCount] = useState<number>(0);
  const [consumerCount, setConsumerCount] = useState<number>(0);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  const handleAddProcess = (type: 'producer' | 'consumer', name: string, message?: string) => {
    const process = new ProcessModel(type, name, message);
    simulationModel.addProcess(process);
    
    if (type === 'producer') {
      setProducerCount(prev => prev + 1);
    } else {
      setConsumerCount(prev => prev + 1);
    }
    
    setSimulationState(simulationModel.getCurrentState());
  };

  const handleDeleteProcess = (id: string) => {
    simulationModel.removeProcess(id);
    setSimulationState(simulationModel.getCurrentState());
  };

  const handleClearAllProcesses = () => {
    simulationModel.removeAllProcesses();
    setProducerCount(0);
    setConsumerCount(0);
    setSimulationState(simulationModel.getCurrentState());
  };

  const handleInitExample = () => {
    simulationModel.initializeExample();
    setProducerCount(2);
    setConsumerCount(2);
    setSimulationState(simulationModel.getCurrentState());
  };

  const handleStartSimulation = () => {
    simulationModel.start();
    setSimulationState(simulationModel.getCurrentState());
  };

  const handleNextStep = () => {
    const newState = simulationModel.nextStep();
    if (newState) {
      setSimulationState(newState);
    }
  };

  const handleResetSimulation = () => {
    simulationModel.reset();
    setSimulationState(simulationModel.getCurrentState());
  };

  const toggleLogModal = () => {
    setIsLogModalOpen(!isLogModalOpen);
  };

  return (
    <Layout>
      <AppContainer>
        <Sidebar>
          <SidebarHeader>
            <ProcessForm 
              onAddProcess={handleAddProcess} 
              producerCount={producerCount} 
              consumerCount={consumerCount} 
            />
          </SidebarHeader>
          
          <ProcessListContainer>
            <ProcessList 
              processes={simulationState.processes} 
              onDelete={handleDeleteProcess}
              onClearAll={handleClearAllProcesses}
              onInitExample={handleInitExample}
            />
          </ProcessListContainer>
          
          <SidebarFooter>
            <SimulationControls 
              isRunning={simulationState.isRunning} 
              onStart={handleStartSimulation} 
              onNext={handleNextStep} 
              onReset={handleResetSimulation} 
            />
          </SidebarFooter>
        </Sidebar>
        
        <MainContent>
          <SimulationArea>
            <SectionTitle>원형 다중 버퍼를 사용한 생산자-소비자 문제 시뮬레이션</SectionTitle>
            
            <SimulationContent>
              <LeftPanel>
                <CurrentProcessIndicator 
                  processes={simulationState.processes}
                  currentProcessIndex={simulationState.currentProcessIndex}
                />
                
                <SemaphoreView 
                  mutexP={simulationState.mutexP} 
                  mutexC={simulationState.mutexC} 
                  nrfull={simulationState.nrfull} 
                  nrempty={simulationState.nrempty} 
                  mutexPQueue={simulationState.mutexPQueue} 
                  mutexCQueue={simulationState.mutexCQueue} 
                  nrfullQueue={simulationState.nrfullQueue} 
                  nremptyQueue={simulationState.nremptyQueue} 
                />
              </LeftPanel>
              
              <RightPanel>
                <CircularBufferView 
                  buffer={simulationState.buffer} 
                  inIndex={simulationState.in} 
                  outIndex={simulationState.out} 
                />
              </RightPanel>
            </SimulationContent>
            
            <ProcessCodeView 
              processes={simulationState.processes}
              mutexPQueue={simulationState.mutexPQueue}
              mutexCQueue={simulationState.mutexCQueue}
              nrfullQueue={simulationState.nrfullQueue}
              nremptyQueue={simulationState.nremptyQueue}
            />
          </SimulationArea>
          <LogButton onClick={toggleLogModal}>로그 보기</LogButton>
        </MainContent>
      </AppContainer>

      <LogModal 
        isOpen={isLogModalOpen} 
        onClose={toggleLogModal} 
        logs={simulationState.consumerLogs} 
      />
    </Layout>
  );
};

export default App;
