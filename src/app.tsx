import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Thunk, TimerStore } from './types';
import {
    COLUMN_GUTTERS,
    SECOND,
    cCARD_TEXT,
    cCARD_TEXT_FAINT,
} from './config';
import { log, formatTime, formatDuration } from './utils';

import { TimerStoreLocalhost } from './timerStoreLocalhost';
import { TimerStoreFirebase } from './timerStoreFirebase';
import { makeTestStore } from './testData';
import { TimerCard, MainButtons } from './timerView';

//================================================================================
// APP VIEW

let sFlexboxColumn : React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    maxWidth: 1000,
    marginLeft: 'auto',
    marginRight: 'auto',
    //background: cGUTTER,
    //border: '5px dashed #666',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: COLUMN_GUTTERS/2,
};
let sFlexboxItemSmall : React.CSSProperties = {
    flexGrow: 0,
    flexShrink: 0,
    margin: COLUMN_GUTTERS/2,
}
let sFlexboxItemLarge : React.CSSProperties = {
    position: 'relative',
    flexGrow: 1,
    flexShrink: 0,
    margin: COLUMN_GUTTERS/2,
}
interface AppViewProps {
    store : TimerStore;
}
interface AppViewState {
    showCompleted : boolean;
}
class AppView extends React.Component<AppViewProps, AppViewState> {
    unsub : Thunk = () => {};
    constructor(props : AppViewProps) {
        super(props);
        this.state = { showCompleted: false };
    }
    _toggleShowCompleted() {
        this.setState({ showCompleted: !this.state.showCompleted });
    }
    componentDidMount() {
        log('AppView.componentDidMount(): subscribing to store');
        this.unsub = this.props.store.onChange(() => this.forceUpdate());
    }
    componentWillUnmount() {
        log('AppView.componentWillUnmount(): unsubscribing from store');
        this.unsub();
    }
    render() {
        log('AppView.render()');
        let width = 200;
        let height = 300;
        let store = this.props.store;
        let timers = store.getTimers();
        return <div style={sFlexboxColumn}>
            {this.state.showCompleted
                ?   <div style={sFlexboxItemLarge}>
                        {timers
                            .filter(timer => timer.completedTime !== null)
                            .map(timer =>
                                <div key={timer.id} style={{color: cCARD_TEXT}}>
                                    <h3>{timer.title}</h3>
                                    <p style={{color: cCARD_TEXT_FAINT}}>
                                        completed at {formatTime(timer.completedTime || 0)}, {formatDuration((timer.completedTime||0) - store.now)}
                                    </p>
                                    <a href="" onClick={(e) => {e.stopPropagation(); e.preventDefault(); store.delete(timer.id)}}>delete</a>
                                    <hr/>
                                </div>
                            )
                        }
                    </div>
                :   timers
                        .filter(timer => timer.completedTime === null)
                        .map(timer =>
                            <div key={timer.id} style={sFlexboxItemLarge}>
                                <TimerCard timer={timer} now={store.now} store={store} />
                            </div>
                        )
            }
            <div style={sFlexboxItemSmall}>
                <MainButtons store={store} onToggleShowCompleted={() => this._toggleShowCompleted()}/>
            </div>
        </div>
    }
}

//================================================================================
// MAIN

let store : TimerStore | null = null;

let USER_ID = window.location.search ? window.location.search.slice(1) : 'public';
let IS_TEST = USER_ID === 'test';
let LOCALHOST_SERVE = window.location.port === '8003';
let LOCALHOST_FIREBASE = window.location.port === '5000';
let NETLIFY = window.location.host.indexOf('netlify.com') !== -1;
let FIREBASE = (  window.location.host.indexOf('web.app') !== -1
               || window.location.host.indexOf('firebaseapp.com') !== -1);

console.log('booting app.  hosting mode:', {USER_ID, IS_TEST, LOCALHOST_FIREBASE, LOCALHOST_SERVE, NETLIFY, FIREBASE});
if (IS_TEST) {
    console.log('booting app in TEST mode');
    store = makeTestStore();
} else if (LOCALHOST_SERVE || NETLIFY) {
    console.log('booting app in LOCALSTORAGE mode');
    store = new TimerStoreLocalhost(3 * SECOND, USER_ID);
} else if (LOCALHOST_FIREBASE || FIREBASE) {
    console.log('booting app in FIREBASE mode');
    store = new TimerStoreFirebase(3 * SECOND, USER_ID);
} else {
    console.log('booting app in ???? mode');
}

if (store) {
    ReactDOM.render(
        <AppView store={store}/>,
        document.getElementById('react-slot')
    );
} else {
    console.error('Did not know what kind of store to create.');
}
