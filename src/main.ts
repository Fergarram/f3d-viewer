import Renderer from './renderer';

const update = (delta: number) => {};
let angle = 0;
const draw = () => {
    Renderer.drawImage('strip', 250, 250, angle);
};

document.addEventListener('keydown', (e) => {
    // console.log(e.key)
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