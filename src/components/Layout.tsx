import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f5f5f5;
    color: #333;
  }
`;

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 300px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
  display: flex;
  flex-direction: column;
  overflow-y: hidden; /* 전체 사이드바는 스크롤 없음 */
  height: 100vh;
`;

const SidebarHeader = styled.div`
  flex-shrink: 0; /* 헤더 영역은 크기 고정 */
`;

const SidebarFooter = styled.div`
  flex-shrink: 0; /* 푸터 영역은 크기 고정 */
  margin-top: 10px;
`;

const ProcessListContainer = styled.div`
  flex: 1;
  margin-bottom: 15px;
  
  /* 스크롤바 스타일 개선 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const SimulationArea = styled.div`
  flex: 1.5;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
`;

const SimulationContent = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
`;

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-right: 15px;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LogArea = styled.div`
  flex: 1;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
  overflow-y: auto;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #444;
`;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <GlobalStyle />
      {children}
    </>
  );
};

export { 
  Layout, 
  AppContainer, 
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  ProcessListContainer,
  MainContent, 
  SimulationArea,
  SimulationContent,
  LeftPanel,
  RightPanel,
  LogArea, 
  SectionTitle 
};
