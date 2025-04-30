import React from 'react';
import styled from 'styled-components';
import { Process } from '../models';

const CodeViewContainer = styled.div`
  margin-top: 15px;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3`
  font-size: 1rem;
  margin-bottom: 10px;
  color: #444;
`;

const ProcessCodeContainer = styled.div`
  display: flex;
  flex-wrap: nowrap; /* 변경: 줄 바꿈 방지 */
  gap: 15px;
  overflow-x: auto; /* 추가: 가로 스크롤 활성화 */
  padding-bottom: 10px; /* 스크롤바 공간 확보 */
  /* justify-content: center; 제거 또는 flex-start로 변경하여 왼쪽 정렬 */
`;

const ProcessCodeCard = styled.div<{ type: 'producer' | 'consumer' }>`
  width: 220px;
  flex-shrink: 0; /* 추가: 카드가 수축되지 않도록 설정 */
  padding: 10px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.type === 'producer' ? '#4a90e2' : '#e2574a'};
`;

const ProcessHeader = styled.div<{ type: 'producer' | 'consumer' }>`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
  
  h4 {
    margin: 0;
    font-size: 0.9rem;
    color: ${props => props.type === 'producer' ? '#4a90e2' : '#e2574a'};
  }
`;

const StatusBadge = styled.span<{ status: 'waiting' | 'running' | 'blocked' | 'finished' }>`
  margin-left: auto;
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: ${props => {
    switch (props.status) {
      case 'running': return 'rgba(40, 167, 69, 0.1)';
      case 'blocked': return 'rgba(220, 53, 69, 0.1)';
      case 'finished': return 'rgba(108, 117, 125, 0.1)'; // 종료됨 상태 배경색 추가
      default: return 'rgba(108, 117, 125, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'running': return '#28a745';
      case 'blocked': return '#dc3545';
      case 'finished': return '#6c757d'; // 종료됨 상태 글자색 추가
      default: return '#6c757d';
    }
  }};
`;

const CodeLine = styled.div<{ active: boolean; blocked: boolean }>`
  padding: 3px 5px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.8rem;
  margin: 2px 0;
  border-radius: 3px;
  background-color: ${props => {
    if (props.blocked) return '#fff3cd';
    if (props.active) return '#e8f4ff';
    return 'transparent';
  }};
  color: ${props => {
    if (props.blocked) return '#856404';
    if (props.active) return '#004085';
    return '#555';
  }};
  position: relative;
  
  &::before {
    content: ${props => props.active ? '"▶"' : '""'};
    position: absolute;
    left: -3px;
    color: ${props => props.active ? '#004085' : 'transparent'};
    font-size: 0.7rem;
  }
`;

interface ProcessCodeViewProps {
  processes: Process[];
  mutexPQueue: Process[];
  mutexCQueue: Process[];
  nrfullQueue: Process[];
  nremptyQueue: Process[];
}

const ProcessCodeView: React.FC<ProcessCodeViewProps> = ({ 
  processes, 
  mutexPQueue, 
  mutexCQueue, 
  nrfullQueue, 
  nremptyQueue 
}) => {
  // 프로세스가 어떤 큐에서 대기 중인지 확인하는 함수
  const getBlockedSemaphore = (process: Process): string | null => {
    if (mutexPQueue.some(p => p.id === process.id)) return 'mutexP';
    if (mutexCQueue.some(p => p.id === process.id)) return 'mutexC';
    if (nrfullQueue.some(p => p.id === process.id)) return 'nrfull';
    if (nremptyQueue.some(p => p.id === process.id)) return 'nrempty';
    return null;
  };

  // 생산자 코드 라인 (steps 배열과 정확히 일치하도록 수정)
  const producerCodeLines = [
    'create a new message M',
    'P(mutexP);',
    'P(nrempty);',
    'buffer[in] <- M;',
    'in <- (in + 1) mod N;',
    'V(nrfull);',
    'V(mutexP);'
  ];

  // 소비자 코드 라인 (steps 배열과 정확히 일치하도록 수정)
  // 첫 번째 세마포어 연산을 P(mutexP)에서 P(mutexC)로 변경
  const consumerCodeLines = [
    'P(mutexC);',
    'P(nrfull);',
    'm <- buffer[out];',
    'out <- (out + 1) mod N;',
    'V(nrempty);',
    'V(mutexC);'
  ];

  return (
    <CodeViewContainer>
      <Title>프로세스 진행 상태</Title>
      <ProcessCodeContainer>
        {processes.map(process => {
          const codeLines = process.type === 'producer' ? producerCodeLines : consumerCodeLines;
          const blockedSemaphore = getBlockedSemaphore(process);
          
          return (
            <ProcessCodeCard key={process.id} type={process.type}>
              <ProcessHeader type={process.type}>
                <h4>{process.name}</h4>
                <StatusBadge status={process.status}>
                  {process.status === 'blocked' && process.waitReason 
                    ? `대기 중 (${process.waitReason})` 
                    : process.status === 'running' 
                      ? '실행 중' 
                      : process.status === 'finished'
                        ? '종료됨' // 종료됨 텍스트 추가
                        : '대기 중'}
                </StatusBadge>
              </ProcessHeader>
              
              {codeLines.map((line, index) => {
                // 현재 실행 중인 라인인지 확인
                const isActive = process.status === 'running' && process.currentStep === index;
                
                // 블록된 라인인지 확인 (P 연산에서 블록된 경우)
                const isBlocked = process.status === 'blocked' && 
                                 ((line.includes('P(mutexP)') && blockedSemaphore === 'mutexP') ||
                                  (line.includes('P(mutexC)') && blockedSemaphore === 'mutexC') ||
                                  (line.includes('P(nrempty)') && blockedSemaphore === 'nrempty') ||
                                  (line.includes('P(nrfull)') && blockedSemaphore === 'nrfull'));
                
                return (
                  <CodeLine 
                    key={index} 
                    active={isActive} 
                    blocked={isBlocked}
                  >
                    {line}
                  </CodeLine>
                );
              })}
            </ProcessCodeCard>
          );
        })}
      </ProcessCodeContainer>
    </CodeViewContainer>
  );
};

export default ProcessCodeView;
