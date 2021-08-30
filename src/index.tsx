import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import './index.css'
const electron = require('electron');
const remote = electron.remote;
const Menu = remote.Menu;

// create a root element to hold our app layout
const root = document.createElement('div');
root.style.height = '100%'; // make the root element fill the screen
document.body.appendChild(root);

// create a render function to keep the ReactDOM call in one place 
const render = (Component: any) => {
    ReactDOM.render(<Component/>, root);
};

const InputMenu = Menu.buildFromTemplate([{
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
    },
]);

document.body.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let node = e.target;

    while (node) {
        if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
            InputMenu.popup(remote.getCurrentWindow());
            break;
        }
        node = node.parentNode;
    }
});

// do the initial render
render(App);

// if we are hot reloading, bind the App import to re-render the app.
// when changes occur to any element, they flow up the dom until
// they find an element that can handle the change. in this case,
// all changes will flow up to the root App, causing the whole
// App to reload
if ((module as any).hot) {
    (module as any).hot.accept('./App', () => { render(App) });
}

