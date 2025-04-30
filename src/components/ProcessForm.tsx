import React, { useState } from 'react';
import styled from 'styled-components';

const FormContainer = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const FormTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 10px;
  color: #444;
`;

const FormGroup = styled.div`
  margin-bottom: 10px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: #aaa;
  }
`;

const Button = styled.button`
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #3a80d2;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const HelpText = styled.div`
  font-size: 0.8rem;
  color: #777;
  margin-top: 4px;
  font-style: italic;
`;

interface ProcessFormProps {
  onAddProcess: (type: 'producer' | 'consumer', name: string, message?: string) => void;
  producerCount: number;
  consumerCount: number;
}

const ProcessForm: React.FC<ProcessFormProps> = ({ onAddProcess, producerCount, consumerCount }) => {
  const [processType, setProcessType] = useState<'producer' | 'consumer'>('producer');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const name = processType === 'producer' 
      ? `P${producerCount + 1}` 
      : `C${consumerCount + 1}`;
    
    // 생산자이고 메시지가 비어있으면 기본 메시지 설정
    let finalMessage = message;
    if (processType === 'producer' && !message.trim()) {
      finalMessage = `${name}의 메시지 #${Math.floor(Math.random() * 1000)}`;
    }
    
    onAddProcess(
      processType, 
      name, 
      processType === 'producer' ? finalMessage : undefined
    );
    
    // 폼 초기화
    setMessage('');
  };

  return (
    <FormContainer>
      <FormTitle>프로세스 추가</FormTitle>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>프로세스 유형</Label>
          <div>
            <label style={{ marginRight: '10px' }}>
              <input
                type="radio"
                value="producer"
                checked={processType === 'producer'}
                onChange={() => setProcessType('producer')}
                style={{ marginRight: '5px' }}
              />
              생산자
            </label>
            <label>
              <input
                type="radio"
                value="consumer"
                checked={processType === 'consumer'}
                onChange={() => setProcessType('consumer')}
                style={{ marginRight: '5px' }}
              />
              소비자
            </label>
          </div>
        </FormGroup>
        
        {processType === 'producer' && (
          <FormGroup>
            <Label>메시지 내용</Label>
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="미입력시 자동 생성"
            />
            <HelpText></HelpText>
          </FormGroup>
        )}
        
        <Button type="submit">
          {processType === 'producer' ? '생산자' : '소비자'} 추가
        </Button>
      </form>
    </FormContainer>
  );
};

export default ProcessForm;
