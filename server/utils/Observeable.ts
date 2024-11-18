import Subscriber from "./Subscriber";

export default class Observable<T> {
    private _observers: Subscriber[] = [];
    public subscribe(subscriber: Subscriber) {
        this._observers.push(subscriber);
    }
    public unsubscribe(subscriber: Subscriber) {
        this._observers = this._observers.filter(o => o !== subscriber);
    }
    public notify(data: T) {
        this._observers.forEach(o => o.getHandler()(data));
    }
}