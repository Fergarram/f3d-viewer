import Renderer from './renderer';

const update = (delta: number) => {};

const draw = () => {
    Renderer.drawImage('strip', 200, 200);
};


const img = new Image();
img.src = 'tower.png';
img.onload = () => {
    (window as any).theImage = img;

    Renderer.init();
    Renderer.loop(update, draw);
};