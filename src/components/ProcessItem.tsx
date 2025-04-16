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

const DragHandle = styled.div`
  color: #aaa;
  cursor: grab;
  display: flex;
  align-items: center;
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
        <DragHandle>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6C4.55228 6 5 5.55228 5 5C5 4.44772 4.55228 4 4 4C3.44772 4 3 4.44772 3 5C3 5.55228 3.44772 6 4 6Z" fill="currentColor"/>
            <path d="M4 9C4.55228 9 5 8.55228 5 8C5 7.44772 4.55228 7 4 7C3.44772 7 3 7.44772 3 8C3 8.55228 3.44772 9 4 9Z" fill="currentColor"/>
            <path d="M4 12C4.55228 12 5 11.5523 5 11C5 10.4477 4.55228 10 4 10C3.44772 10 3 10.4477 3 11C3 11.5523 3.44772 12 4 12Z" fill="currentColor"/>
            <path d="M8 6C8.55228 6 9 5.55228 9 5C9 4.44772 8.55228 4 8 4C7.44772 4 7 4.44772 7 5C7 5.55228 7.44772 6 8 6Z" fill="currentColor"/>
            <path d="M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z" fill="currentColor"/>
            <path d="M8 12C8.55228 12 9 11.5523 9 11C9 10.4477 8.55228 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12Z" fill="currentColor"/>
            <path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" fill="currentColor"/>
            <path d="M12 9C12.5523 9 13 8.55228 13 8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8C11 8.55228 11.4477 9 12 9Z" fill="currentColor"/>
            <path d="M12 12C12.5523 12 13 11.5523 13 11C13 10.4477 12.5523 10 12 10C11.4477 10 11 10.4477 11 11C11 11.5523 11.4477 12 12 12Z" fill="currentColor"/>
          </svg>
        </DragHandle>
      </ControlsContainer>
    </ProcessItemContainer>
  );
};

export default ProcessItem;
