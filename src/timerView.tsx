import * as React from 'react';

import { Timer, Thunk, TimerStore } from "./types";
import {
    BUTTON_GUTTER,
    BUTTON_HEIGHT,
    CARD_PADDING,
    HEAVY_X,
    LINE_HEIGHT,
    MINUTE,
    PIECHART_DURATION,
    RADIUS,
    cBUTTON_BG,
    cBUTTON_TEXT,
    cCARD_BG,
    cCARD_TEXT,
    cCARD_TEXT_FAINT,
    cCOLOR_MAP,
    cDATAVIZ_BACKGROUND,
    cPIE_TEXT,
    mapLookup,
    FONT_SIZE,
    EXTRA_FONT_SIZE_FOR_TITLE,
} from "./config";
import {
    clamp,
    formatDuration,
    formatTime,
    log,
    parseTime,
    roundTowardsZero
} from "./utils";


let sTimerCard: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: cCARD_TEXT,
    background: cCARD_BG,
    borderRadius: RADIUS,
    padding: 10,
};
let sTitle: React.CSSProperties = {
    color: cCARD_TEXT,
    fontWeight: 'bold',
    fontSize: FONT_SIZE + EXTRA_FONT_SIZE_FOR_TITLE,
    position: 'absolute',
    top: CARD_PADDING,
    left: CARD_PADDING,
    minWidth: 100,
};
let sDetailLeft: React.CSSProperties = {
    color: cCARD_TEXT_FAINT,
    position: 'absolute',
    top: CARD_PADDING + LINE_HEIGHT + EXTRA_FONT_SIZE_FOR_TITLE,
    left: CARD_PADDING,
};
let sDetailRight: React.CSSProperties = {
    color: cCARD_TEXT_FAINT,
    position: 'absolute',
    top: CARD_PADDING + LINE_HEIGHT + EXTRA_FONT_SIZE_FOR_TITLE,
    right: CARD_PADDING,
};
let sDeleteButton: React.CSSProperties = {
    color: cCARD_TEXT_FAINT,
    position: 'absolute',
    top: CARD_PADDING,
    right: CARD_PADDING,
};
let sButtonBar : React.CSSProperties = {
    height: BUTTON_HEIGHT,
    textAlign: 'center',
    display: 'flex',
    margin: `0 ${-BUTTON_GUTTER/2}px`,  // hack for gutters
}
let sButtonBarInCard : React.CSSProperties = {
    ...sButtonBar,
    position: 'absolute',
    left: CARD_PADDING,
    right: CARD_PADDING,
    bottom: CARD_PADDING,
}
let sButton : React.CSSProperties = {
    border: 'none',
    color: cBUTTON_TEXT,
    background: cBUTTON_BG,
    height: BUTTON_HEIGHT,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: RADIUS,
}
let sButtonBarButton : React.CSSProperties = {
    ...sButton,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 1,
    margin: `0 ${BUTTON_GUTTER/2}px`,  // hack for gutters
}
let sDatavizZone : React.CSSProperties = {
    position: 'absolute',
    top: CARD_PADDING, // + 2 * LINE_HEIGHT + 5,
    bottom: CARD_PADDING, // + BUTTON_HEIGHT + CARD_PADDING,
    left: CARD_PADDING,
    right: CARD_PADDING,
    background: cDATAVIZ_BACKGROUND,
    borderRadius: RADIUS,
}


interface StoreProps {
    store : TimerStore;
    onToggleShowCompleted : Thunk;
}
export let MainButtons: React.FunctionComponent<StoreProps> = ({store, onToggleShowCompleted}) =>
    <div style={sButtonBar}>
        <button style={sButtonBarButton} onClick={() => {
            //let title = prompt('Title:');
            //if (title === null) { return; }
            //store.createTimer(title);
            store.createTimer('===');
        }}>
            + new timer
        </button>
        <button style={sButtonBarButton} onClick={onToggleShowCompleted}>
            show completed
        </button>
    </div>;

interface PieChartProps {
    pctFull : number;
    colorFull : string;
    colorEmpty : string;
    text : string;
    colorText : string;
}
let sSvgTransition : React.CSSProperties = {
    transitionProperty: 'fill, stroke',
    transitionDuration: '0.4s',
    transitionTimingFunction: 'ease-out',
}
export let PieChartSVG: React.FunctionComponent<PieChartProps> = ({pctFull, colorFull, colorEmpty, text, colorText}) => {
    // pctFull in range 0-1
    // https://seesparkbox.com/foundry/how_to_code_an_SVG_pie_chart
    let strokeWidth = 2;
    let circ = 2 * Math.PI * 25;
    let dasharray1 = (1-pctFull) * circ;
    let dasharray2 = circ;
    return <svg
        viewBox={`${-strokeWidth} ${-strokeWidth} ${100+strokeWidth*2} ${100+strokeWidth*2}`}
        preserveAspectRatio="xMidYMid meet"
        height="100%"
        width="100%"
        style={{pointerEvents: 'none', position: 'absolute'}}
        >
        {/* background circle, "full" color */}
        <circle r="50" cx="50" cy="50" style={{...sSvgTransition, fill: colorFull, stroke: colorFull}} strokeWidth={strokeWidth} />
        {/* empty slice to cover full color. starts small pointing upward at pctFull=100, grows clockwise and ends as full circle at pctFull=0 */}
        <circle r="25" cx="50" cy="50"
            style={{...sSvgTransition, fill: "transparent", stroke: colorEmpty}}
            strokeWidth="50"
            strokeDasharray={`${dasharray1} ${dasharray2}`}
            transform="rotate(-90) translate(-100)"
            />
        <text x="50" y="50" fill={colorText} textAnchor="middle" dominantBaseline="middle" fontSize="25">{text}</text>
    </svg>;
}

let sButtonOverlay : React.CSSProperties = {
    position: 'absolute',
    left: CARD_PADDING,
    right: CARD_PADDING,
    bottom: CARD_PADDING,
    height: BUTTON_HEIGHT + CARD_PADDING*2,
    background: cCARD_BG,
}

interface TimerCardProps {
    timer : Timer;
    now : number;
    store : TimerStore;
}
interface TimerCardState {
    showButtons : boolean;
}
export class TimerCard extends React.Component<TimerCardProps, TimerCardState> {
    constructor(props : TimerCardProps) {
        super(props);
        this.state = { showButtons: false };
    }
    _changeTitle() {
        this.props.store.changeTitle(this.props.timer.id, prompt("Title:", this.props.timer.title) || "");
    }
    _changeStartTime() {
        let newString = prompt("Start time:", formatTime(this.props.timer.startTime)) || "";
        let newTime = parseTime(newString);
        if (newTime) { this.props.store.changeStartTime(this.props.timer.id, newTime); }
    }
    _changeEndTime() {
        let newString = prompt("End time:", formatTime(this.props.timer.endTime)) || "";
        let newTime = parseTime(newString);
        if (newTime) { this.props.store.changeEndTime(this.props.timer.id, newTime); }
    }
    _deleteTimer() {
        this.props.store.delete(this.props.timer.id);
    }
    _completeTimer() {
        this.props.store.complete(this.props.timer.id, this.props.now);
    }
    _snooze() {
        this.props.store.snooze(this.props.timer.id);
    }
    _toggleButtons() {
        log('toggling buttons', this.state);
        this.setState({
            showButtons: !this.state.showButtons,
        });
    }
    render() {
        let {timer, now, store} = this.props;
        let remaining = timer.endTime - now;

        // piechart setup
        let pctFull = clamp(remaining / PIECHART_DURATION, 0, 1);
        let {cFull, cEmpty, cEmptyAlt, cTogglePeriod} = mapLookup(cCOLOR_MAP, remaining);
        let textForPie = `${roundTowardsZero(remaining / MINUTE)}m`;

        if (cTogglePeriod !== null && cEmptyAlt !== null) {
            if (Math.floor(now / cTogglePeriod) % 2 === 0) {
                cEmpty = cEmptyAlt;
            }
        }

        return <div style={sTimerCard}>
            <div style={sDatavizZone} onClick={() => this._toggleButtons()}>
                <PieChartSVG
                    pctFull={pctFull}
                    colorFull={cFull} colorEmpty={cEmpty}
                    text={textForPie} colorText={cPIE_TEXT}
                />
            </div>
            <div style={sTitle} onClick={() => this._changeTitle()}>{timer.title || <i>(untitled timer)</i>}</div>
            <div style={sDetailLeft}>
                <div onClick={() => this._changeStartTime()}>
                    started:<br/>{formatTime(timer.startTime)}
                </div>
                <div>({formatDuration(timer.startTime - now)})</div>
            </div>
            <div style={sDetailRight}>
                <div style={{textAlign: 'right'}} onClick={() => this._changeEndTime()}>
                    ends:<br/>{formatTime(timer.endTime)}
                </div>
                <div>({formatDuration(timer.endTime - now)})</div>
            </div>
            <div style={sDeleteButton} onClick={() => this._deleteTimer()}>{HEAVY_X}</div>
            {this.state.showButtons
              ? <div style={sButtonOverlay}
                    onClick={() => this._toggleButtons()}
                    >
                    <div style={sButtonBarInCard} onClick={(e) => {e.stopPropagation();}}>
                        <button style={sButtonBarButton} onClick={() => this._completeTimer()}>did it</button>
                        <button style={sButtonBarButton} onClick={() => this._snooze()}>+ 10 minutes</button>
                    </div>
                </div>
              : null
            }
        </div>
    }
}