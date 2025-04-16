import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Process } from '../models';
import { motion, AnimatePresence } from 'framer-motion';

// 애니메이션 정의
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const fadeInOut = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
`;

const SemaphoreContainer = styled.div`
  display: flex;
  margin: 15px 0;
  width: 100%;
`;

const SemaphoreGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 5px;
`;

const SemaphoreLabel = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: #444;
`;

const SemaphoreValue = styled.div<{ isChanging: boolean }>`
  width: 40px;
  height: 40px;
  border: 2px solid #4a90e2;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  color: #444;
  background-color: white;
  margin-bottom: 5px;
  transition: all 0.3s ease;
  animation: ${props => props.isChanging ? pulseAnimation : 'none'} 0.5s ease;
`;

const QueueContainer = styled.div<{ position: 'left' | 'right' }>`
  display: flex;
  flex-direction: ${props => props.position === 'left' ? 'row-reverse' : 'row'};
  align-items: center;
  min-height: 40px;
  width: 100%;
  max-width: 240px; /* 최대 너비 추가 */
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 3px;
  background-color: #fdfdfd;
  overflow: hidden; /* 중요: 내부 콘텐츠가 넘칠 경우 숨김 처리 */
`;

const QueueLabel = styled.div`
  font-size: 0.7rem;
  color: #777;
  margin: 0 5px;
  white-space: nowrap;
  flex-shrink: 0; /* 라벨이 줄어들지 않도록 설정 */
`;

const QueueItems = styled.div<{ position: 'left' | 'right' }>`
  display: flex;
  flex-direction: ${props => props.position === 'left' ? 'row-reverse' : 'row'};
  flex-wrap: nowrap;
  overflow-x: auto; /* 가로 스크롤 활성화 */
  padding: 3px;
  min-height: 35px;
  width: 100%;
  
  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    height: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f1f1f1;
  }
  
  /* Firefox 스크롤바 */
  scrollbar-width: thin;
  scrollbar-color: #ccc #f1f1f1;
`;

const QueueItem = styled(motion.div)<{ type: 'producer' | 'consumer'; status: string }>`
  min-width: 35px;
  height: 30px;
  margin: 0 2px;
  flex-shrink: 0; /* 아이템이 줄어들지 않도록 설정 */
  background-color: ${props => {
    if (props.status === 'blocked') {
      return props.type === 'producer' ? '#7fb5f1' : '#f18e86';
    }
    return props.type === 'producer' ? '#4a90e2' : '#e2574a';
  }};
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
    border: 2px solid white;
    opacity: ${props => props.status === 'running' ? 1 : 0};
    animation: ${props => props.status === 'running' ? fadeInOut : 'none'} 1.5s infinite;
  }
`;

interface SemaphoreViewProps {
  mutexP: number;
  mutexC: number;
  nrfull: number;
  nrempty: number;
  mutexPQueue: Process[];
  mutexCQueue: Process[];
  nrfullQueue: Process[];
  nremptyQueue: Process[];
}

const SemaphoreView: React.FC<SemaphoreViewProps> = ({
  mutexP,
  mutexC,
  nrfull,
  nrempty,
  mutexPQueue,
  mutexCQueue,
  nrfullQueue,
  nremptyQueue
}) => {
  // 값 변화 감지를 위한 상태
  const [prevMutexP, setPrevMutexP] = useState(mutexP);
  const [prevMutexC, setPrevMutexC] = useState(mutexC);
  const [prevNrfull, setPrevNrfull] = useState(nrfull);
  const [prevNrempty, setPrevNrempty] = useState(nrempty);
  
  // 값 변화 애니메이션을 위한 상태
  const [mutexPChanging, setMutexPChanging] = useState(false);
  const [mutexCChanging, setMutexCChanging] = useState(false);
  const [nrfullChanging, setNrfullChanging] = useState(false);
  const [nremptyChanging, setNremptyChanging] = useState(false);

  // 값 변화 감지 및 애니메이션 처리
  useEffect(() => {
    if (mutexP !== prevMutexP) {
      setMutexPChanging(true);
      setPrevMutexP(mutexP);
      setTimeout(() => setMutexPChanging(false), 500);
    }
  }, [mutexP, prevMutexP]);

  useEffect(() => {
    if (mutexC !== prevMutexC) {
      setMutexCChanging(true);
      setPrevMutexC(mutexC);
      setTimeout(() => setMutexCChanging(false), 500);
    }
  }, [mutexC, prevMutexC]);

  useEffect(() => {
    if (nrfull !== prevNrfull) {
      setNrfullChanging(true);
      setPrevNrfull(nrfull);
      setTimeout(() => setNrfullChanging(false), 500);
    }
  }, [nrfull, prevNrfull]);

  useEffect(() => {
    if (nrempty !== prevNrempty) {
      setNremptyChanging(true);
      setPrevNrempty(nrempty);
      setTimeout(() => setNremptyChanging(false), 500);
    }
  }, [nrempty, prevNrempty]);

  return (
    <div>
      <SemaphoreContainer>
        <SemaphoreGroup>
          <SemaphoreLabel>mutexP</SemaphoreLabel>
          <SemaphoreValue isChanging={mutexPChanging}>{mutexP}</SemaphoreValue>
          <QueueContainer position="left">
            <QueueLabel>대기 큐</QueueLabel>
              <QueueItems position="left">
                <AnimatePresence>
                  {mutexPQueue.map((process) => (
                    <QueueItem
                      key={process.id}
                      type={process.type}
                      status={process.status}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {process.name}
                    </QueueItem>
                  ))}
                </AnimatePresence>
              </QueueItems>
          </QueueContainer>
        </SemaphoreGroup>
        
        <SemaphoreGroup>
          <SemaphoreLabel>mutexC</SemaphoreLabel>
          <SemaphoreValue isChanging={mutexCChanging}>{mutexC}</SemaphoreValue>
          <QueueContainer position="right">
            <QueueLabel>대기 큐</QueueLabel>
              <QueueItems position="right">
                <AnimatePresence>
                  {mutexCQueue.map((process) => (
                    <QueueItem
                      key={process.id}
                      type={process.type}
                      status={process.status}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {process.name}
                    </QueueItem>
                  ))}
                </AnimatePresence>
              </QueueItems>
          </QueueContainer>
        </SemaphoreGroup>
      </SemaphoreContainer>
      
      <SemaphoreContainer>
        <SemaphoreGroup>
          <SemaphoreLabel>nrfull</SemaphoreLabel>
          <SemaphoreValue isChanging={nrfullChanging}>{nrfull}</SemaphoreValue>
          <QueueContainer position="left">
            <QueueLabel>대기 큐</QueueLabel>
              <QueueItems position="left">
                <AnimatePresence>
                  {nrfullQueue.map((process) => (
                    <QueueItem
                      key={process.id}
                      type={process.type}
                      status={process.status}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {process.name}
                    </QueueItem>
                  ))}
                </AnimatePresence>
              </QueueItems>
          </QueueContainer>
        </SemaphoreGroup>
        
        <SemaphoreGroup>
          <SemaphoreLabel>nrempty</SemaphoreLabel>
          <SemaphoreValue isChanging={nremptyChanging}>{nrempty}</SemaphoreValue>
          <QueueContainer position="right">
            <QueueLabel>대기 큐</QueueLabel>
              <QueueItems position="right">
                <AnimatePresence>
                  {nremptyQueue.map((process) => (
                    <QueueItem
                      key={process.id}
                      type={process.type}
                      status={process.status}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {process.name}
                    </QueueItem>
                  ))}
                </AnimatePresence>
              </QueueItems>
          </QueueContainer>
        </SemaphoreGroup>
      </SemaphoreContainer>
    </div>
  );
};

export default SemaphoreView;