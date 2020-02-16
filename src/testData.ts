import { MINUTE } from './config';
import { TimerStoreLocalhost } from './timerStoreLocalhost';
import { rand, makeId } from "./utils";

//================================================================================
// TEST STORE

export let makeTestStore = () => {
    let now = Date.now();
    let store = new TimerStoreLocalhost(null, 'test');
    store._resetStorage();
    store.now = now;
    let mins = [-(8 * 60), -21.2, -2.2, 3.2, 17.2, 222.2];
    //let mins = [-1.1, -0.9, -0.3, 0, 0.3, 0.9, 1.1];
    let ii = 0;
    for (let min of mins) {
        store.push({
            id: makeId(),
            title: `timer ${min}`,
            startTime: now + (-4 + ii*2) * MINUTE,
            completedTime: null,
            endTime: now + min * MINUTE,
        });
        store.push({
            id: makeId(),
            title: `timer ${min} ... done`,
            startTime: now + (-4 + ii*2) * MINUTE,
            completedTime: now + rand(-120, 120) * MINUTE,
            endTime: now + min * MINUTE,
        });
        ii += 1;
    }
    return store;
}
