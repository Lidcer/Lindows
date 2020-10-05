import { Renderer } from '../Renderer';
import { Drawable } from './Drawable';

export class Square extends Drawable {
    time = 0;
    constructor(renderer: Renderer, size = 10) {
        super(renderer);
        this.x = 0;
        this.y = 0;
        this.size = size;
    }

    get vertices() {
        const vec1 = [this.posX, this.posY];
        const vec2 = [this.posX + this.horizontalSize, this.posY];
        const vec3 = [this.posX, this.posY - this.verticalSize];
        const vec4 = [this.posX + this.horizontalSize, this.posY - this.verticalSize];

        return [
            ...vec1,  ...this.colour, // this.time,
            ...vec2,  ...this.colour, // this.time,
            ...vec3,  ...this.colour, // this.time,
            ...vec2,  ...this.colour, // this.time,
            ...vec3,  ...this.colour, // this.time,
            ...vec4,  ...this.colour, // this.time
        ];
    }

    get shapes() {
        return 1;
    }
}
