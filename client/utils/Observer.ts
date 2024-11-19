export default class Observer<T> {
    private subscribers: Function[];

    constructor() {
        this.subscribers = [];
    }

    subscribe(callback: Function) {
        this.subscribers.push(callback);
    }

    unsubscribe(callback: Function) {
        this.subscribers = this.subscribers.filter(subscriber => subscriber !== callback);
    }

    notify(data: T) {
        this.subscribers.forEach(callback => callback(data));
    }
}