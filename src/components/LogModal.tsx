import React from 'react';
import styled from 'styled-components';
import { ConsumerLog } from '../models';
import ConsumerLogTable from './ConsumerLogTable';

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
`;

const ModalTitle = styled.h2`
  font-size: 1.2rem;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;
  padding: 5px;
  line-height: 1;
  
  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  overflow-y: auto;
  flex-grow: 1;
`;

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ConsumerLog[];
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}> 
        <ModalHeader>
          <ModalTitle>소비자 로그</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <ConsumerLogTable logs={logs} />
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default LogModal;