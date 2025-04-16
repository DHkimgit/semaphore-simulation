import React from 'react';
import styled from 'styled-components';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import ProcessItem from './ProcessItem';
import { Process } from '../models';

const ProcessListContainer = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
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
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
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
        case 'primary': return '#3a80d2';
        case 'secondary': return '#e0e0e0';
        case 'danger': return '#d73c2c';
        default: return '#e0e0e0';
      }
    }};
  }
`;

const EmptyList = styled.div`
  padding: 15px;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  border: 1px dashed #ddd;
  border-radius: 6px;
`;

interface ProcessListProps {
  processes: Process[];
  onReorder: (newOrder: string[]) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onInitExample: () => void;
}

const ProcessList: React.FC<ProcessListProps> = ({ 
  processes, 
  onReorder, 
  onDelete, 
  onClearAll, 
  onInitExample 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = processes.findIndex(p => p.id === active.id);
      const newIndex = processes.findIndex(p => p.id === over.id);
      
      const newProcesses = [...processes];
      const [movedProcess] = newProcesses.splice(oldIndex, 1);
      newProcesses.splice(newIndex, 0, movedProcess);
      
      onReorder(newProcesses.map(p => p.id));
    }
  };

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
            초기화
          </Button>
          <Button 
            variant="primary" 
            onClick={onInitExample}
            title="예시 프로세스 구성으로 초기화"
          >
            예시 초기화
          </Button>
        </ButtonsContainer>
      </ListHeader>
      
      {processes.length === 0 ? (
        <EmptyList>프로세스가 없습니다. 프로세스를 추가해주세요.</EmptyList>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext 
            items={processes.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {processes.map((process) => (
              <ProcessItem 
                key={process.id} 
                id={process.id} 
                process={process}
                onDelete={onDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </ProcessListContainer>
  );
};

export default ProcessList;
