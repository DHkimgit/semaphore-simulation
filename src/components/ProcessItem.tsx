import React from 'react';
import styled from 'styled-components';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Process } from '../models';

const ProcessItemContainer = styled.div<{ isDragging: boolean }>`
  padding: 10px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
  transition: all 0.2s;
  opacity: ${props => props.isDragging ? 0.5 : 1};
  transform: scale(${props => props.isDragging ? 0.95 : 1});
  
  &:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
`;

const ProcessInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ProcessName = styled.span`
  font-weight: 500;
  margin-bottom: 3px;
`;

const ProcessType = styled.span<{ type: 'producer' | 'consumer' }>`
  font-size: 0.8rem;
  color: ${props => props.type === 'producer' ? '#4a90e2' : '#e2574a'};
`;

const ProcessMessage = styled.span`
  font-size: 0.8rem;
  color: #777;
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(231, 76, 60, 0.1);
  }
`;

interface ProcessItemProps {
  process: Process;
  id: string;
  onDelete: (id: string) => void;
}

const ProcessItem: React.FC<ProcessItemProps> = ({ process, id, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <ProcessItemContainer
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      {...attributes}
      {...listeners}
    >
      <ProcessInfo>
        <ProcessName>{process.name}</ProcessName>
        <ProcessType type={process.type}>
          {process.type === 'producer' ? '생산자' : '소비자'}
        </ProcessType>
        {process.message && (
          <ProcessMessage title={process.message}>
            메시지: {process.message}
          </ProcessMessage>
        )}
      </ProcessInfo>
      <ControlsContainer>
        <DeleteButton onClick={handleDelete} title="프로세스 삭제">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
          </svg>
        </DeleteButton>
      </ControlsContainer>
    </ProcessItemContainer>
  );
};

export default ProcessItem;
