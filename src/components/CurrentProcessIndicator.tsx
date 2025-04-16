import React from 'react';
import styled from 'styled-components';
import { Process } from '../models';
import { motion } from 'framer-motion';

const CurrentProcessContainer = styled.div`
  margin: 15px 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h3`
  font-size: 1rem;
  margin-bottom: 10px;
  color: #444;
  align-self: flex-start;
`;

const ProcessCard = styled(motion.div)<{ type: 'producer' | 'consumer' }>`
  width: 100%;
  max-width: 400px;
  padding: 15px;
  border-radius: 10px;
  background-color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  border-left: 5px solid ${props => props.type === 'producer' ? '#4a90e2' : '#e2574a'};
  display: flex;
  flex-direction: column;
`;

const ProcessHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const ProcessName = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  color: #333;
`;

const ProcessType = styled.span<{ type: 'producer' | 'consumer' }>`
  margin-left: 10px;
  padding: 3px 8px;
  border-radius: 15px;
  font-size: 0.8rem;
  background-color: ${props => props.type === 'producer' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(226, 87, 74, 0.1)'};
  color: ${props => props.type === 'producer' ? '#4a90e2' : '#e2574a'};
`;

const ProcessStatus = styled.div`
  display: flex;
  align-items: center;
  margin-top: 5px;
`;

const StatusLabel = styled.span`
  font-size: 0.9rem;
  color: #666;
  margin-right: 8px;
`;

const StatusValue = styled.span<{ status: string }>`
  font-size: 0.9rem;
  font-weight: bold;
  color: ${props => {
    switch (props.status) {
      case 'running': return '#28a745';
      case 'blocked': return '#dc3545';
      default: return '#6c757d';
    }
  }};
`;

const CurrentStep = styled.div`
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 5px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  color: #333;
`;

const NoProcess = styled.div`
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
  text-align: center;
  width: 100%;
  max-width: 400px;
`;

interface CurrentProcessIndicatorProps {
  processes: Process[];
  currentProcessIndex: number;
}

const CurrentProcessIndicator: React.FC<CurrentProcessIndicatorProps> = ({ 
  processes, 
  currentProcessIndex 
}) => {
  const currentProcess = processes[currentProcessIndex];
  
  return (
    <CurrentProcessContainer>
      <Title>현재 실행 중인 프로세스</Title>
      
      {currentProcess ? (
        <ProcessCard 
          type={currentProcess.type}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ProcessHeader>
            <ProcessName>{currentProcess.name}</ProcessName>
            <ProcessType type={currentProcess.type}>
              {currentProcess.type === 'producer' ? '생산자' : '소비자'}
            </ProcessType>
          </ProcessHeader>
          
          <ProcessStatus>
            <StatusLabel>상태:</StatusLabel>
            <StatusValue status={currentProcess.status}>
              {currentProcess.status === 'running' ? '실행 중' : 
               currentProcess.status === 'blocked' ? `대기 중 (${currentProcess.waitReason})` : 
               '대기 중'}
            </StatusValue>
          </ProcessStatus>
          
          {currentProcess.status === 'running' && (
            <CurrentStep>
              현재 실행 중인 코드: {currentProcess.steps[currentProcess.currentStep]}
            </CurrentStep>
          )}
        </ProcessCard>
      ) : (
        <NoProcess>
          실행 중인 프로세스가 없습니다.
        </NoProcess>
      )}
    </CurrentProcessContainer>
  );
};

export default CurrentProcessIndicator;
