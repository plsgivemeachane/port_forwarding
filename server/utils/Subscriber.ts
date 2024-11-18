export default class Subscriber {

    private fn: Function;

    constructor(fn: Function) {
        this.fn = fn;
    }

    public getHandler() {
        return this.fn;
    }
}