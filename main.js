const electron = require('electron')
const BrowserWindow = electron.BrowserWindow;
const app = electron.app
const path = require('path')
const fs = require('fs');
const ipc = electron.ipcMain;
const dialog = electron.dialog;
const chokidar = require('chokidar');
const parseMagicaVoxel = require('parse-magica-voxel');

ipc.on('open-model', (event) => {
    dialog.showOpenDialog({ properties: ['openFile'] }).then((fileInfo) => {
        
        // Initial load
        const path = fileInfo.filePaths[0];
        fs.readFile(path, (err, buffer) => {
            if (err) throw err;
            event.sender.send('model-loaded', parseMagicaVoxel(buffer));
        });

        // Start watching for changes
        const watcher = chokidar.watch(path, {
            persistent: true
        });

        // Reload on change
        watcher.on('change', (path) => {
            fs.readFile(path, (err, buffer) => {
                if (err) throw err;
                event.sender.send('model-loaded', parseMagicaVoxel(buffer));
            });
        })
    });
})

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 640,
        height: 480,
        minWidth: 320,
        minHeight: 320,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)
app.allowRendererProcessReuse = true;

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
