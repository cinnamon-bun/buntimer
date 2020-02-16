export type Thunk = () => void;

export type Timer = {
    id : string;
    title : string;
    startTime : number;
    endTime : number;
    completedTime : number | null;  // when it was marked done, or null if not marked done
};

export interface TimerStore {
    timers : {
        [id: string]: Timer;
    };
    now : number;
    // persistence
    _resetStorage() : Promise<void>;
    _save() : Promise<void>;
    _load() : Promise<void>;
    // subscriptions
    onChange(cb : Thunk) : Thunk;
    _notify() : void;
    // getters
    getTimers() : Timer[];
    // add new timers
    push(t : Timer) : void;
    createTimer(title : string) : void;
    // mutators
    complete(id : string, now : number) : void;
    uncomplete(id : string) : void;
    changeCompletedTime(id : string, completedTime : number) : void;
    delete(id : string) : void;
    snooze(id : string) : void;
    changeTitle(id : string, title : string) : void;
    changeStartTime(id : string, startTime : number) : void;
    changeEndTime(id : string, endTime : number) : void;
}
