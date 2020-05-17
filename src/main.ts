import Renderer from './renderer';

const update = (delta: number) => {};

const draw = () => {
    Renderer.drawImage('one', 0, 0);
};
Renderer.allImages['one'] = new HTMLImageElement();
Renderer.init();
Renderer.loop(update, draw);