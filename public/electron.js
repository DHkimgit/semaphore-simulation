const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // 브라우저 창 생성
  const mainWindow = new BrowserWindow({
    width: 1980,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  // 개발 환경에서는 React 개발 서버 URL 로드, 프로덕션 환경에서는 빌드된 index.html 파일 로드
  // const startUrl = isDev
  //   ? 'http://localhost:3000' // 리액트 개발 서버 주소
  //   : `file://${path.join(__dirname, '../build/index.html')}`; // 빌드된 리액트 앱의 index.html 경로
  const startUrl = `file://${path.join(__dirname, '../build/index.html')}`

  mainWindow.loadURL(startUrl);

  // 창이 닫힐 때 발생하는 이벤트
  mainWindow.on('closed', () => {
  });
}

// Electron 앱이 준비되면 창 생성
app.whenReady().then(createWindow);

// 모든 창이 닫혔을 때 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 앱이 활성화되었을 때 (macOS)
app.on('activate', () => {
  // 독 아이콘을 클릭했을 때 창이 없으면 새로 생성
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
