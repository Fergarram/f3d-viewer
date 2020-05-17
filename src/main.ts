import Renderer from './renderer';

const update = (delta: number) => {};

const draw = () => {
    Renderer.drawImage('strip', 0, 0);
};


const img = new Image();
img.src = 'castle-damaged.png';
img.onload = () => {
    (window as any).theImage = img;

    Renderer.init();
    Renderer.loop(update, draw);
};