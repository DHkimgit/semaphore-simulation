const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1980,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  // const startUrl = isDev
  //   ? 'http://localhost:3000' // 리액트 개발 서버 주소
  //   : `file://${path.join(__dirname, '../build/index.html')}`; // 빌드된 리액트 앱의 index.html 경로
  const startUrl = `file://${path.join(__dirname, '../build/index.html')}`

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
