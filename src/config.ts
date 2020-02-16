
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAgo3uaH6iE7rPION6mpw164hZw-QW__5A",
    authDomain: "buntimer2020.firebaseapp.com",
    databaseURL: "https://buntimer2020.firebaseio.com",
    projectId: "buntimer2020",
    storageBucket: "buntimer2020.appspot.com",
    messagingSenderId: "158404617479",
    appId: "1:158404617479:web:671fbf7656ba562fe251a2"
};


// constants
export let SECOND = 1000;
export let MINUTE = SECOND * 60;
export let HOUR = MINUTE * 60;
export let DAY = HOUR * 24;

export let HEAVY_X = '\u2716';  // for close buttons

// time-related
export let SNOOZE = 10 * MINUTE;

// pixel sizes
export let FONT_SIZE = 16;
export let LINE_HEIGHT = 21;
export let EXTRA_FONT_SIZE_FOR_TITLE = 4;
export let BUTTON_HEIGHT = LINE_HEIGHT + 20;
export let BUTTON_GUTTER = 10;  // between buttons
export let CARD_PADDING = 10;  // within cards
export let COLUMN_GUTTERS = 10;  // between cards
export let RADIUS = 10;

// colors
export let cCARD_BG = 'black';
export let cCARD_TEXT = 'white';
export let cCARD_TEXT_FAINT = 'rgba(255,255,255,0.6)';
export let cBUTTON_BG = '#1D273C';
export let cBUTTON_TEXT = '#A1C1DD';

// piechart
export let PIECHART_DURATION = 60 * MINUTE;
export let cDATAVIZ_BACKGROUND = 'black';
export let cELAPSED = 'rgba(0, 0, 0, 0.8)';  // slightly transparent black
export let cGOOD = '#224024';  // green
export let cWARNING = '#bb0';  // yellow
export let cBAD = '#e80202';  // red
export let cBAD_ALT = '#9c0020';
export let cSTALE = '#a35';  // reddish gray
export let cPIE_TEXT = 'rgba(255,255,255,0.2)';

type MapPair<T> = [number, T];
export let cCOLOR_MAP : MapPair<PieChartColors>[] = [
    // if time left is < this threshold, apply these colors.
    // find your spot in this list betweeen the two items that
    // bracket your value, and return the upper one.
    [99999999 * MINUTE, {cFull: cGOOD,    cEmpty: cELAPSED, cEmptyAlt: null,     cTogglePeriod: null}       ],  // green on black
    [      15 * MINUTE, {cFull: cWARNING, cEmpty: cELAPSED, cEmptyAlt: null,     cTogglePeriod: null}       ],  // yellow on black
    [       0 * MINUTE, {cFull: cBAD,     cEmpty: cELAPSED, cEmptyAlt: null,     cTogglePeriod: null}       ],  // red on black
    [      -1 * MINUTE, {cFull: cBAD,     cEmpty: cBAD    , cEmptyAlt: cBAD_ALT, cTogglePeriod: 60 * SECOND}],  // red on red
    [        -6 * HOUR, {cFull: cSTALE,   cEmpty: cSTALE  , cEmptyAlt: null,     cTogglePeriod: null}       ],  // reddish gray
];

export type PieChartColors = {
    cFull : string,
    cEmpty : string,
    cEmptyAlt : string | null;
    cTogglePeriod : number | null;
};

export let mapLookup = <T>(map : MapPair<T>[], value : number) : T => {
    let result : T = map[0][1];
    for (let [threshold, item] of map) {
        if (value <= threshold) {
            result = item;
        }
    }
    return result;
}
