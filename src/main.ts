import Renderer from './renderer';
const electron = require('electron');
const ipc = electron.ipcRenderer;

ipc.send('open-model');
ipc.on('model-loaded', (event, data) => {
    console.log(data);
})

const update = (delta: number) => {};
let angle = 0;
const draw = () => {
    Renderer.drawImage('strip', 220, 220, angle);
};

document.addEventListener('keydown', (e) => {
    console.log(e.key)

    if (e.key === 'ArrowRight') {
        e.preventDefault();
        angle += 1.5;
    }
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        angle -= 1.5;
    }
});

const img = new Image();
img.src = 'house.png';
img.onload = () => {
    (window as any).theImage = img;

    Renderer.init();
    Renderer.loop(update, draw);
};