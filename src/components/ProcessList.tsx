import React from 'react';
import styled from 'styled-components';
import ProcessItem from './ProcessItem';
import { Process } from '../models';

const ProcessListContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 370px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ListTitle = styled.h3`
  font-size: 1rem;
  margin: 0;
  color: #444;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: ${props => props.variant === 'primary' ? '8px 14px' : '6px 10px'};
  border-radius: 4px;
  font-size: ${props => props.variant === 'primary' ? '0.80rem' : '0.8rem'};
  font-weight: ${props => props.variant === 'primary' ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  background-color: ${props => {
    switch (props.variant) {
      case 'primary': return '#4a90e2';
      case 'secondary': return '#f0f0f0';
      case 'danger': return '#e74c3c';
      default: return '#f0f0f0';
    }
  }};
  
  color: ${props => props.variant === 'primary' || props.variant === 'danger' ? 'white' : '#444'};
  
  &:hover {
    background-color: ${props => {
      switch (props.variant) {
        case 'primary': return '#0056b3';
        case 'secondary': return '#e0e0e0';
        case 'danger': return '#d73c2c';
        default: return '#e0e0e0';
      }
    }};
    box-shadow: ${props => props.variant === 'primary' ? '0 2px 8px rgba(0, 123, 255, 0.3)' : 'none'}; // Primary 호버 시 그림자 효과 추가
  }
`;

const EmptyList = styled.div`
  padding: 15px;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  border: 1px dashed #ddd;
  border-radius: 6px;
  white-space: pre-line;
`;

const ListArea = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  margin-top: 15px;
  padding-right: 5px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #aaa;
  }
`;

interface ProcessListProps {
  processes: Process[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onInitExample: () => void;
}

const ProcessList: React.FC<ProcessListProps> = ({ 
  processes, 
  onDelete, 
  onClearAll, 
  onInitExample 
}) => {
  return (
    <ProcessListContainer>
      <ListHeader>
        <ListTitle>프로세스 순서</ListTitle>
        <ButtonsContainer>
          <Button 
            variant="secondary" 
            onClick={onClearAll}
            title="모든 프로세스 삭제"
          >
            프로세스 초기화
          </Button>
          <Button 
            variant="primary" 
            onClick={onInitExample}
            title="예시 프로세스 구성으로 초기화"
          >
            시나리오 적용
          </Button>
        </ButtonsContainer>
      </ListHeader>

      <ListArea>
        {processes.length === 0 ? (
        <EmptyList>{`프로세스가 없습니다.\n프로세스를 추가해주세요.`}</EmptyList>
      ) : (
        processes.map((process) => (
          <ProcessItem 
            key={process.id} 
            id={process.id} 
            process={process}
            onDelete={onDelete}
          />
        ))    
        )}
      </ListArea>
    </ProcessListContainer>
  );
};

export default ProcessList;
