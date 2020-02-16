import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import {FIREBASE_CONFIG} from './config';

import { Timer, Thunk, TimerStore } from "./types";
import { SNOOZE, MINUTE } from "./config";
import { log, makeId, timerCmp } from "./utils";

let fbapp = firebase.initializeApp(FIREBASE_CONFIG);
let db = firebase.firestore();

let FIREBASE_DOCUMENT_KEY = 'buntimer2020-v1';
export class TimerStoreFirebase implements TimerStore {
    timers : {
        [id: string]: Timer;
    };
    now : number;
    cbs : Thunk[];  // subscription callbacks
    userId : string;  // this is used as the firebase collection
    constructor(updateEvery : number | null, userId : string) {
        this.timers = {};
        this.now = Date.now();
        this.cbs = [];
        this.userId = userId;
        this._load();
        if (updateEvery) {
            setInterval(() => {
                this.now = Date.now();
                console.log('store timer update');
                this._notify()
            }, updateEvery);
        }
        // set up realtime updates from firebase
        db.collection(this.userId).doc(FIREBASE_DOCUMENT_KEY).onSnapshot(doc => {
            console.log('incoming firebase data', doc.metadata.hasPendingWrites ? '(local)' : '(server)');
            if (doc.exists) {
                this.timers = doc.data() as any;
            } else {
                this.timers = {};
            }
            this._notify();
        });
    }
    // persistence
    async _resetStorage() : Promise<void> {
        log('store._resetStorage()');
        this.timers = {};
        await db.collection(this.userId).doc(FIREBASE_DOCUMENT_KEY).delete();
        log('store._resetStorage() ... success');
    }
    async _save() : Promise<void> {
        log('store._save()');
        await db.collection(this.userId).doc(FIREBASE_DOCUMENT_KEY).set(this.timers);
        log('store._save() ... success');
    }
    async _load() : Promise<void> {
        log('store._load()');
        let doc = await db.collection(this.userId).doc(FIREBASE_DOCUMENT_KEY).get();
        if (doc.exists) {
            this.timers = doc.data() as any;
            log('store._load() ... success, loaded existing data');
        } else {
            // document doesn't exist yet
            this.timers = {};
            log('store._load() ... success, does not exist yet');
        }
        this._notify();
        log('store._load() ... complete.  this.timers = ', this.timers);
    }
    // subscriptions
    onChange(cb : Thunk) : Thunk {
        log('store.onChange subscription created');
        this.cbs.push(cb);
        let unsub = () : void => {
            log('store - unsub');
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
        log('store.getTimers()', this.timers);
        let ts = Object.values(this.timers);
        ts.sort(timerCmp);
        return ts;
    }
    // add new timers
    push(t : Timer) : void {
        log('store.push(t)');
        this.timers[t.id] = t;
        this._save();
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
    }
    // mutators
    complete(id : string, now : number) : void {
        log(`store.complete(${id}, ${now})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.completedTime = now;
        this._save();
    }
    uncomplete(id : string) : void {
        log(`store.uncomplete(${id})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.completedTime = null;
        this._save();
    }
    changeCompletedTime(id : string, completedTime : number) : void {
        log(`store.changeCompletedTime(${id}, ${completedTime})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.completedTime = completedTime;
        this._save();
    }
    delete(id : string) : void {
        log(`store.delete(${id})`);
        delete this.timers[id];
        this._save();
    }
    snooze(id : string) : void {
        log(`store.snooze(${id})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.endTime += SNOOZE;
        this._save();
    }
    changeTitle(id : string, title : string) : void {
        log(`store.changeTitle(${id}, ${title})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        title = title.trim();
        if (!title) { return; }
        t.title = title;
        this._save();
    }
    changeStartTime(id : string, startTime : number) : void {
        log(`store.changeStartTime(${id}, ${startTime})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.startTime = startTime;
        this._save();
    }
    changeEndTime(id : string, endTime : number) : void {
        log(`store.changeEndTime(${id}, ${endTime})`);
        let t = this.timers[id];
        if (t === undefined) { return; }
        t.endTime = endTime;
        this._save();
    }
}
