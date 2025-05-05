import React from 'react';
import styled from 'styled-components';
import { ConsumerLog } from '../models';

const LogTableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const TableHead = styled.thead`
  background-color: #f2f2f2;
`;

const TableBody = styled.tbody`
  background-color: white;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const TableHeader = styled.th`
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #444;
  border-bottom: 1px solid #ddd;
`;

const TableCell = styled.td`
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
`;

const EmptyMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
`;

interface ConsumerLogTableProps {
  logs: ConsumerLog[];
}

const ConsumerLogTable: React.FC<ConsumerLogTableProps> = ({ logs }) => {
  return (
    <LogTableContainer>
      {logs.length === 0 ? (
        <EmptyMessage>소비자 프로세스가 소비한 메시지가 없습니다.</EmptyMessage>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>소비자</TableHeader>
              <TableHeader>메시지 생산자</TableHeader>
              <TableHeader>소비한 메시지 내용</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, index) => (
              <TableRow key={index}>
                <TableCell>{log.consumerName}</TableCell>
                <TableCell>{log.producerName}</TableCell>
                <TableCell>{log.messageContent}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </LogTableContainer>
  );
};

export default ConsumerLogTable;
