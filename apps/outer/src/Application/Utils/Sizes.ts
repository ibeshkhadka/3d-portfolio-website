import EventEmitter from './EventEmitter';

export default class Sizes extends EventEmitter {
    width: number;
    height: number;
    pixelRatio: number;

    constructor() {
        super();

        // Setup (clamped so a 0x0 pre-layout viewport can't produce NaN aspects)
        this.width = Math.max(1, window.innerWidth);
        this.height = Math.max(1, window.innerHeight);
        this.pixelRatio = Math.min(window.devicePixelRatio, 2);

        // Resize event
        window.addEventListener('resize', () => {
            this.width = Math.max(1, window.innerWidth);
            this.height = Math.max(1, window.innerHeight);
            this.pixelRatio = Math.min(window.devicePixelRatio, 2);

            this.trigger('resize');
        });
    }
}
