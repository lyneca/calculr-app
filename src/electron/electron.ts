import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';

// declare a variable to hold the browser window
let win: BrowserWindow | null

function createWindow() {
    // create a browser window
    win = new BrowserWindow({
        width: 800,
        height: 600,
        // remove the default minimize, maximize, and close buttons
        // so we can have more control over our app's theming
        frame: false, 
        webPreferences: {
            // enable node integration for the browser so we
            // can do node things like use the file system
            nodeIntegration: true
        }
    });

    if (process.env.NODE_ENV === 'production') {
        // if we are in production mode, load the file
        // from the static, compiled source
        win.loadFile(path.resolve(__dirname, '../render/index.html'));
    } else {
        // if in development, point at the webpack-dev-server
        // so we can do hot reloading, and show the the dev tools
        win.loadURL('http://localhost:9000');
        win.webContents.openDevTools();
    }

    // use different menus for macos and window/linux
    if (process.platform === 'darwin') {
        Menu.setApplicationMenu(Menu.buildFromTemplate([
            {
                label: process.platform === 'darwin' ? 'Calculr' : 'File',
                submenu: [
                    {
                        label: process.platform === 'darwin' ? 'Quit' : 'Close',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        role: 'quit'
                    },
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    {
                        label: 'Undo',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Z' : 'Ctrl+Z',
                        role: 'undo',
                    }, {
                        label: 'Redo',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Shift+Z' : 'Ctrl+Y',
                        role: 'redo',
                    }, {
                        type: 'separator',
                    }, {
                        label: 'Cut',
                        accelerator: process.platform === 'darwin' ? 'Cmd+X' : 'Ctrl+X',
                        role: 'cut',
                    }, {
                        label: 'Copy',
                        accelerator: process.platform === 'darwin' ? 'Cmd+C' : 'Ctrl+C',
                        role: 'copy',
                    }, {
                        label: 'Paste',
                        accelerator: process.platform === 'darwin' ? 'Cmd+V' : 'Ctrl+V',
                        role: 'paste',
                    }, {
                        type: 'separator',
                    }, {
                        label: 'Select all',
                        accelerator: process.platform === 'darwin' ? 'Cmd+A' : 'Ctrl+A',
                        role: 'selectall',
                    }
                ]
            }
        ]));
    } else {
        Menu.setApplicationMenu(Menu.buildFromTemplate([
            
        ]));
    }

    // dereference our window when it closes
    win.on('closed', () => {
        win = null;
    });
}

// kick everything off when the app is ready
app.on('ready', createWindow);
