import debounce from 'lodash/debounce';

const Promise = require("bluebird");
const DID_FOCUS_INPUT = 'DID_FOCUS_INPUT';
const DID_CHANGE_INPUT = 'DID_CHANGE_INPUT';
const DID_NOT_CHANGE_STALE_VALUE = 'DID_NOT_CHANGE_STALE_VALUE';
const DID_BLUR_BEFORE_FETCH_COMPLETED = 'DID_BLUR_BEFORE_FETCH_COMPLETED';
const WILL_VALIDATE_ON_CHANGE = 'WILL_VALIDATE_ON_CHANGE';
const WILL_VALIDATE_ON_BLUR = 'WILL_VALIDATE_ON_BLUR';
const DID_VALIDATE_INPUT = 'DID_VALIDATE_INPUT';
const WILL_START_CHANGE = 'WILL_START_CHANGE_WITH_FETCH';
const DID_START_DEBOUNCED_CHANGE = 'DID_START_DEBOUNCED_CHANGE_WITH_FETCH';
const DID_END_DEBOUNCED_CHANGE = 'DID_END_DEBOUNCED_CHANGE';

const initialState = {
    pendingDebounceDuration: false,
    numberOfPendingDebouncedChanges: 0,
    value: "",
    valid: null
}

// fake backend configured on two ports to mimic slow and fast responses
function fetchOptions (value) {
    const fastUrl = `http://localhost:3001/words` // 1000ms
    const slowUrl = `http://localhost:3002/words` // 500ms

    const queryUrl = value === 'az'
        ? `${fastUrl}?q=${value}`
        : `${slowUrl}?q=${value}`;

    return fetch(queryUrl)
        .then(function(response) {
            return response.json()
        })
}

function validateInput(state) {
    const {value, options} = state;
    const valid = options && !!(options.find((option) => option.value === value));
    return {
        type: DID_VALIDATE_INPUT, valid
    }
}

const debouncedChangeInput = debounce(
    function changeInputBase(value, getState, dispatch) {
        let state;
        return Promise
            .try(() => dispatch({type: DID_START_DEBOUNCED_CHANGE}))
            .then(() => fetchOptions(value))
            .then(function (options) {
                state = getState();
                const currentInputValue = state.value;
                if (currentInputValue === value) {
                    return dispatch({type: DID_CHANGE_INPUT, value, options});
                }
                return dispatch({type: DID_NOT_CHANGE_STALE_VALUE})
            })
            .then(function () {
                const state = getState();
                const {blurredTooFast, valid} = state;
                if (valid === false || blurredTooFast) {
                    dispatch({type: WILL_VALIDATE_ON_CHANGE});
                    return dispatch (validateInput(state))
                    }
            })
            .catch((e) => dispatch({type: 'error', e}))
            .finally(() => dispatch({type: DID_END_DEBOUNCED_CHANGE}));
    },
    300
)

export function changeInput(value) {
    return function (dispatch, getState) {
        return Promise
            .try(() => dispatch({type: WILL_START_CHANGE, value}))
              .then(() => debouncedChangeInput(value, getState, dispatch))
    }
}

export function blurInput() {
    return function (dispatch, getState) {
        const state = getState();
        const {pendingDebounceDuration, numberOfPendingDebouncedChanges} = state;

        if (!pendingDebounceDuration && numberOfPendingDebouncedChanges === 0) {
            dispatch({type: WILL_VALIDATE_ON_BLUR})
            return dispatch(validateInput(state));
        }

        return Promise
            .try(() => dispatch({type: DID_BLUR_BEFORE_FETCH_COMPLETED, value: true}))
            .then(() => debouncedChangeInput.flush());
    }
}

export function focusInput() {
    return {type: DID_FOCUS_INPUT};
}

export default function reducer (state = initialState, action) {
    switch (action.type) {
        case DID_FOCUS_INPUT:
            return {
                ...state,
                blurredTooFast: false
            }
        
        case WILL_START_CHANGE:
            return {
                ...state,
                pendingDebounceDuration: true,
                value: action.value
            }
        
        case DID_START_DEBOUNCED_CHANGE:
            return {
                ...state,
                pendingDebounceDuration: false,
                numberOfPendingDebouncedChanges: state.numberOfPendingDebouncedChanges + 1
            }

        case DID_END_DEBOUNCED_CHANGE:
            return {
                ...state,
                    numberOfPendingDebouncedChanges: state.numberOfPendingDebouncedChanges - 1
            }
    
        case DID_CHANGE_INPUT:
            return {
                ...state,
                value: action.value,
                options: action.options
            }

        case DID_VALIDATE_INPUT:
            return {
                ...state,
                valid: action.valid
            }

        case DID_BLUR_BEFORE_FETCH_COMPLETED:
            return {
                ...state,
                blurredTooFast: true
            }

        default:
            return state
    }
}