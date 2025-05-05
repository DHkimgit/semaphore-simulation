import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Message } from '../models';
import { motion, AnimatePresence } from 'framer-motion';

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const CircularBufferContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative;
`;

const BufferCircleContainer = styled.div`
  position: relative;
  width: 260px;
  height: 260px;
  margin: 0 auto;
`;

const BufferCircle = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid #4a90e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InnerCircle = styled.div`
  width: 20%;
  height: 20%;
  border: 2px solid #4a90e2;
  border-radius: 50%;
`;

const BufferCell = styled.div<{ index: number }>`
  position: absolute;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #444;
  border: 2px solid #4a90e2;
  border-radius: 8px;
  background-color: white;
  
  ${({ index }) => {
    const angle = (index * 90) * (Math.PI / 180);
    const radius = 95; /* 반지름 증가 */
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    
    return `
      top: ${130 + y}px;
      left: ${130 + x}px;
      transform: translate(-50%, -50%);
    `;
  }}
`;

const BufferLabel = styled.div<{ index: number }>`
  position: absolute;
  font-size: 0.9rem;
  font-weight: bold;
  color: #444;
  
  ${({ index }) => {
    const angle = (index * 90) * (Math.PI / 180);
    const radius = 150;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    
    return `
      top: ${130 + y}px;
      left: ${130 + x}px;
      transform: translate(-50%, -50%);
    `;
  }}
`;

const MessageBubble = styled(motion.div)<{ type: 'producer' | 'consumer' }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: ${props => props.type === 'producer' ? '#4a90e2' : '#e2574a'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  position: relative;
`;

const MessageTooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  margin-bottom: 5px;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
`;

const VariableContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 15px;
  margin-bottom: 30px;
  width: 100%;
  gap: 30px;
`;

const VariableBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VariableLabel = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: #444;
`;

const VariableValue = styled.div<{ isChanging: boolean; position: 'in' | 'out' }>`
  width: 40px;
  height: 40px;
  border: 2px solid ${props => props.position === 'in' ? '#4a90e2' : '#e2574a'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  color: ${props => props.position === 'in' ? '#4a90e2' : '#e2574a'};
  background-color: white;
  transition: all 0.3s ease;
  animation: ${props => props.isChanging ? pulseAnimation : 'none'} 0.5s ease;
`;

const PointerArrow = styled.div<{ position: 'in' | 'out', index: number }>`
  position: absolute;
  width: 16px;
  height: 16px;
  background-color: ${props => props.position === 'in' ? '#4a90e2' : '#e2574a'};
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  transition: all 0.5s ease;
  
  ${({ index, position }) => {
    const angle = (index * 90) * (Math.PI / 180);
    const radius = position === 'in' ? 40 : 60;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const rotation = angle * (180 / Math.PI) + 90;
    
    return `
      top: ${130 + y}px;
      left: ${130 + x}px;
      transform: translate(-50%, -50%) rotate(${rotation}deg);
    `;
  }}
`;

interface CircularBufferViewProps {
  buffer: (Message | null)[];
  inIndex: number;
  outIndex: number;
}

const CircularBufferView: React.FC<CircularBufferViewProps> = ({ buffer, inIndex, outIndex }) => {
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [prevInIndex, setPrevInIndex] = useState(inIndex);
  const [prevOutIndex, setPrevOutIndex] = useState(outIndex);
  const [inChanging, setInChanging] = useState(false);
  const [outChanging, setOutChanging] = useState(false);

  React.useEffect(() => {
    if (inIndex !== prevInIndex) {
      setInChanging(true);
      setPrevInIndex(inIndex);
      setTimeout(() => setInChanging(false), 500);
    }
  }, [inIndex, prevInIndex]);

  React.useEffect(() => {
    if (outIndex !== prevOutIndex) {
      setOutChanging(true);
      setPrevOutIndex(outIndex);
      setTimeout(() => setOutChanging(false), 500);
    }
  }, [outIndex, prevOutIndex]);

  return (
    <CircularBufferContainer>
      <VariableContainer>
        <VariableBox>
          <VariableLabel>in</VariableLabel>
          <VariableValue isChanging={inChanging} position="in">{inIndex}</VariableValue>
        </VariableBox>
        <VariableBox>
          <VariableLabel>out</VariableLabel>
          <VariableValue isChanging={outChanging} position="out">{outIndex}</VariableValue>
        </VariableBox>
      </VariableContainer>
      
      <BufferCircleContainer>
        <BufferCircle>
          <InnerCircle />
          
          {buffer.map((_, index) => (
            <BufferCell key={`cell-${index}`} index={index}>
              <AnimatePresence mode="wait">
                {buffer[index] && (
                  <MessageBubble 
                    type="producer"
                    onMouseEnter={() => setHoveredMessage(buffer[index]?.producerName || null)}
                    onMouseLeave={() => setHoveredMessage(null)}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {buffer[index]?.producerName}
                    {hoveredMessage === buffer[index]?.producerName && (
                      <MessageTooltip>
                        {buffer[index]?.content}
                      </MessageTooltip>
                    )}
                  </MessageBubble>
                )}
              </AnimatePresence>
            </BufferCell>
          ))}
          
          {buffer.map((_, index) => (
            <BufferLabel key={`label-${index}`} index={index}>
              A[{index}]
            </BufferLabel>
          ))}
          
          <PointerArrow position="in" index={inIndex} />
          <PointerArrow position="out" index={outIndex} />
        </BufferCircle>
      </BufferCircleContainer>
    </CircularBufferContainer>
  );
};

export default CircularBufferView;
