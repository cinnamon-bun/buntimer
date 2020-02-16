import { Timer, Thunk, TimerStore } from "./types";
import { SNOOZE, MINUTE } from "./config";
import { log, makeId, timerCmp } from "./utils";

let LOCAL_STORAGE_KEY = 'buntimer2020-v1';
export class TimerStoreLocalhost implements TimerStore {
    timers : {
        [id: string]: Timer;
    };
    now : number;
    cbs : Thunk[];  // subscription callbacks
    userId : string;
    localStorageKey : string;
    constructor(updateEvery : number | null, userId : string) {
        this.timers = {};
        this.now = Date.now();
        this.cbs = [];
        this.userId = userId;
        this.localStorageKey = LOCAL_STORAGE_KEY + userId,
        this._load();
        if (updateEvery) {
            setInterval(() => {
                this.now = Date.now();
                this._notify()},
            updateEvery);
        }
    }
    // persistence
    async _resetStorage() : Promise<void> {
        log('store._resetStorage()');
        this.timers = {};
        window.localStorage.removeItem(this.localStorageKey);
        this._notify();
    }
    async _save() : Promise<void> {
        log('store._save()');
        window.localStorage.setItem(this.localStorageKey, JSON.stringify(this.timers));
    }
    async _load() : Promise<void> {
        log('store._load()');
        this.timers = JSON.parse(window.localStorage.getItem(this.localStorageKey) || '{}');
        // hack to add a createdTime to old data
        for (let timer of Object.values(this.timers)) {
            let tOld : any = timer;
            // move createdTime to startTime
            if (tOld.createdTime !== undefined) {
                timer.startTime = tOld.createdTime;
                delete tOld.createdTime;
            }
            // make a startTime if there isn't one
            if (timer.startTime === undefined) {
                timer.startTime = this.now - 60 * MINUTE;
            }
        }
        this._notify();
    }
    // subscriptions
    onChange(cb : Thunk) : Thunk {
        log('store.onChange subscription created');
        this.cbs.push(cb);
        let unsub = () : void => {
            this.cbs = this.cbs.filter(c => c !== cb);
        };
        return unsub;
    }
    _notify() : void {
        log('store._notify() start');
        for (let cb of this.cbs) { cb(); }
        log('store._notify() end');
    }
    // getters
    getTimers() : Timer[] {
        let ts = Object.values(this.timers);
        ts.sort(timerCmp);
        return ts;
    }
    // add new timers
    push(t : Timer) : void {
        log('store.push(t)');
        this.timers[t.id] = t;
        this._save();
        this._notify();
    }
    createTimer(title : string) : void {
        log('store.createTimer()');
        let t : Timer = {
            id : makeId(),
            title: title,
            startTime: this.now,
            endTime: this.now + 90 * MINUTE,
            completedTime: null,
        }
        this.timers[t.id] = t;
        this._save();
        this._notify();
    }
    // mutators
    complete(id : string, now : number) : void {
        log(`store.complete(${id}, ${now})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.completedTime = now;
        this._save();
        this._notify();
    }
    uncomplete(id : string) : void {
        log(`store.uncomplete(${id})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.completedTime = null;
        this._save();
        this._notify();
    }
    changeCompletedTime(id : string, completedTime : number) : void {
        log(`store.changeCompletedTime(${id}, ${completedTime})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.completedTime = completedTime;
        this._save();
        this._notify();
    }
    delete(id : string) : void {
        log(`store.delete(${id})`);
        delete this.timers[id];
        this._save();
        this._notify();
    }
    snooze(id : string) : void {
        log(`store.snooze(${id})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.endTime += SNOOZE;
        this._save();
        this._notify();
    }
    changeTitle(id : string, title : string) : void {
        log(`store.changeTitle(${id}, ${title})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        title = title.trim();
        if (!title) { return; }
        t.title = title;
        this._save();
        this._notify();
    }
    changeStartTime(id : string, startTime : number) : void {
        log(`store.changeStartTime(${id}, ${startTime})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.startTime = startTime;
        this._save();
        this._notify();
    }
    changeEndTime(id : string, endTime : number) : void {
        log(`store.changeEndTime(${id}, ${endTime})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.endTime = endTime;
        this._save();
        this._notify();
    }
}
