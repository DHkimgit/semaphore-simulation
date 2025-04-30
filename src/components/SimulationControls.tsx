import React from 'react';
import styled from 'styled-components';

const ControlsContainer = styled.div`
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
`;

const ControlsTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 10px;
  color: #444;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background-color: ${props => {
    switch (props.variant) {
      case 'primary': return '#4a90e2';
      case 'secondary': return '#6c757d';
      case 'danger': return '#dc3545';
      default: return '#4a90e2';
    }
  }};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
  white-space: ${props => {
    switch (props.variant) {
      case 'primary': return 'nowrap';
      case'secondary': return 'nowrap';
      case 'danger': return 'pre-line';
      default: return 'nowrap';
    }
  }};
  
  &:hover {
    background-color: ${props => {
      switch (props.variant) {
        case 'primary': return '#3a80d2';
        case 'secondary': return '#5a6268';
        case 'danger': return '#c82333';
        default: return '#3a80d2';
      }
    }};
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

interface SimulationControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onNext: () => void;
  onReset: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  onStart,
  onNext,
  onReset,
}) => {
  return (
    <ControlsContainer>
      <ControlsTitle>시뮬레이션 제어</ControlsTitle>
      
      {!isRunning ? (
        <ButtonGroup>
          <Button variant="primary" onClick={onStart}>
            시뮬레이션 시작
          </Button>
        </ButtonGroup>
      ) : (
        <ButtonGroup>
          <Button variant="danger" onClick={onReset}>
            {`시뮬레이션 \n초기화`}
          </Button>
          <Button variant="primary" onClick={onNext}>
              다음 상황
          </Button>
        </ButtonGroup>
      )}
    </ControlsContainer>
  );
};

export default SimulationControls;
