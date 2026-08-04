const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron')
const path = require('path')
const os = require('os')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '海报设计编辑器 - 桌面版',
    icon: path.join(__dirname, '../public/favicon.ico'),
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextBridge: true,
      webSecurity: true,
    },
  })

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC Handlers for system / file dialogs
ipcMain.handle('get-machine-code', () => {
  const networkInterfaces = os.networkInterfaces()
  let macAddress = ''
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name] || []) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        macAddress = net.mac
        break
      }
    }
    if (macAddress) break
  }
  const rawId = `${os.hostname()}-${os.platform()}-${os.arch()}-${macAddress}`
  return Buffer.from(rawId).toString('base64').replace(/=/g, '').toUpperCase().slice(0, 24)
})

ipcMain.handle('show-save-dialog', async (event, options) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})

ipcMain.handle('show-open-dialog', async (event, options) => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result
})

ipcMain.handle('save-file', async (event, { defaultPath, filters, base64Data, textData }) => {
  if (!mainWindow) return { canceled: true }
  const fs = require('fs')
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  })
  if (canceled || !filePath) return { canceled: true }

  try {
    if (base64Data) {
      const buffer = Buffer.from(base64Data.replace(/^data:.*?;base64,/, ''), 'base64')
      fs.writeFileSync(filePath, buffer)
    } else if (textData !== undefined) {
      fs.writeFileSync(filePath, textData, 'utf-8')
    }
    return { canceled: false, filePath }
  } catch (err) {
    console.error('Failed to write file natively:', err)
    return { canceled: true, error: String(err) }
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
