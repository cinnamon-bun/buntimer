import NamedRegExp from 'named-regexp-groups';

import { Timer } from './types';
import { MINUTE } from './config';

let _monotonicNow = Date.now();
export let monotonicNow = () : number => {
    _monotonicNow = Math.max(_monotonicNow+1, Date.now());
    return _monotonicNow;
}

export let roundTowardsZero = (n : number) : number =>
    n < 0 ? -Math.floor(-n) : Math.floor(n);

export let log = (...args : any[]) => console.log(...args);

export let clamp = (n: number, low: number, high: number): number => Math.max(low, Math.min(high, n));

export let remap = (n : number, oldLow: number, oldHigh: number, newLow: number, newHigh: number) : number => {
    let pct = (n - oldLow) / (oldHigh - oldLow);
    return pct * (newHigh - newLow) + newLow;
}

export let rand = (low : number, high : number) : number =>
    remap(Math.random(), 0, 1, low, high);

// random number inclusive of endpoints
export let randint = (low : number, high : number) : number =>
    Math.floor(rand(low, high+0.999999));

export let makeId = () : string =>
    `timer-${monotonicNow()}-${randint(100000000, 999999999)}`;

export let posMod = (a : number, b : number) : number =>
    ((a % b) + b) % b;

export let formatTime = (time : number) => {
    let d = new Date(time);
    let hour = d.getHours();
    let ampm = hour < 12 ? 'am' : 'pm';
    hour = hour % 12;
    if (hour == 0) {
        hour = 12;
    }
    let min = d.getMinutes();
    let m = ('' + min).padStart(2, '0');
    return `${hour}:${m}${ampm}`;
};

export let formatDuration = (duration : number) => {
    // positive durations are in the future
    let isNow = Math.abs(duration) < 1 * MINUTE;
    if (isNow) { return 'now'; }

    let min = Math.floor(Math.abs(duration) / MINUTE);
    let hr = Math.floor(min / 60);
    min = min % 60;
    let s = `${min}m`;
    if (hr) { s = `${hr}h ${min}m`; }

    if (duration > 0) { return `in ${s}`; }
    return `${s} ago`;
};

export let parseTime = (s : string) : number | null => {
    // parse times like:
    // 1   1a   1 pm   1:00   1:00 p   1:00PM    1 p.m.   1p.m.
    // if am/pm are not specified, interpret it as a 24 hour time (e.g. "11" -> 11am, "12" -> noon, "13" -> 1pm)
    // set the hour and minute of the current day, then convert to unix time and return.
    // the time must be the entire string (except for leading and trailing whitespace)

    //log(`parseTime(${s})`);
    //                         (--12------)(:------------)?sp?(-----ampm-----------------)?
    //                                       (---34-----)      (----a.------)(m-|-.m.--)?
    let rx = new NamedRegExp(/^(:<hr>\d?\d)(:(:<min>\d\d))?\ ?((:<ampm>[ap]?)(m|[.]m[.])?)?$/i);
    s = s.trim().toLowerCase();
    let match = rx.exec(s);
    if (!match) {
        log(s.padEnd(10, ' '), null);
        return null;
    }
    let groups = match.groups;
    let hr = parseInt(groups['hr'], 10);
    let min = parseInt(groups['min'] || '0', 10);
    let am = groups['ampm']; // 'a', 'p', or undefined
    //let debug1 = `-${hr}-${min}-${am}`.padEnd(17, ' ');
    if (am === 'a') {
        // "12a" = hour 0, midnight
        if (hr === 12) { hr = 0; }
    } else if (am && am === 'p') {
        // "12p" = hour 12, noon
        // "1p" = hour 13
        if (hr === 12) { hr = 0; }
        hr += 12;
    } else {
        // 24 hour time, no hacks needed
        // "0" = midnight
        // "12" = noon  // this one is extra ambiguous if not thinking in 24 hour time
    }
    //let debug2 = `-${hr}-${min}-${am}`.padEnd(17, ' ');
    //log(s.padEnd(10, ' '), debug1, debug2);
    let date = new Date();
    date.setHours(hr);
    date.setMinutes(min);
    date.setSeconds(0);
    date.setMilliseconds(0);
    //log(hr, ':', min, am);
    //log(date);
    //log(date.getTime());
    return date.getTime();
}

let testParseTime = () => {
    let equivs : string[][] = [
        ['0', '12:00am'],
        ['0:34', '12:34a', '12:34 a', '12:34am', '12:34 am', '12:34a.m.'],// '12:34 a.m.', '12:34a.m', '12:34 am.', 'zzz 12:34am zzz'],
        ['1', '1a', '1 a', '1am', '1 am', '1A', '1 AM'],
        ['5', '5a', '5:00 am'],
        ['11', '11a', ' 11a '],
        ['12', '12:00pm'],
        ['13', '1p', '1:00pm', '1p.m.', '1 p.m.', '1P'],
        ['23:59', '11:59pm'],
        ['not', 'a', 'time', 'zzz 12:34am zzz', '1p.', '1pm.'],  // => null
    ]
    console.log('testing parseTime');
    let numFailed = 0;
    for (let set of equivs) {
        console.log('---------------------');
        let unixes = set.map(parseTime);
        for (let ii = 0; ii < unixes.length; ii++) {
            if (unixes[0] !== unixes[ii]) {
                console.warn('ERROR: these should be equal but they are not:');
                console.warn(set[0], '=>', unixes[0], (new Date(unixes[0] || 0)).toLocaleTimeString());
                console.warn(set[ii], '=>', unixes[ii], (new Date(unixes[ii] || 0)).toLocaleTimeString());
                numFailed += 1;
            }
        }
    }
    console.log(numFailed, 'failed');
}

// for sorting timers
export let timerCmp = (a: Timer, b: Timer) => {
    // completed items last
    if ((a.completedTime === null) !== (b.completedTime === null)) {
        return (a.completedTime === null) ? -1 : 1;
    }
    if (a.completedTime !== null && b.completedTime !== null) {
        // within completed items, sort by completed time
        return a.completedTime - b.completedTime;
    } else {
        // within not completed
        return a.endTime - b.endTime;  // items about to expire, first
        // return a.id > b.id ? 1 : -1;  // newly added items, last
    }
};
