import debounce from 'lodash/debounce';

const Promise = require("bluebird");
const DID_FOCUS_INPUT = 'DID_FOCUS_INPUT';
const DID_BEGIN_LOADING = 'DID_BEGIN_LOADING';
const DID_END_LOADING = 'DID_END_LOADING';
const DID_CHANGE_INPUT = 'DID_CHANGE_INPUT';
const DID_BLUR_BEFORE_FETCH_COMPLETED = 'DID_BLUR_BEFORE_FETCH_COMPLETED';
const DID_VALIDATE_INPUT = 'DID_VALIDATE_INPUT';
const DID_CANCEL_FETCH = 'DID_CANCEL_FETCH';
const WILL_START_CHANGE = 'WILL_START_CHANGE_WITH_FETCH';
const DID_START_DEBOUNCED_CHANGE = 'DID_START_DEBOUNCED_CHANGE_WITH_FETCH';
const DID_END_DEBOUNCED_CHANGE = 'DID_END_DEBOUNCED_CHANGE';

const initialState = {
    pendingDebounceDuration: false,
    numberOfPendingDebouncedChanges: 0,
    value: "",
    valid: null
}

function fetchOptions (value) {
    const validationQueryUrl = `http://localhost:3001/words?q=${value}`
    return fetch(validationQueryUrl)
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
        return Promise
            .try(() => dispatch({type: DID_START_DEBOUNCED_CHANGE}))
            .then(() => fetchOptions(value))
            .then((options) => dispatch({type: DID_CHANGE_INPUT, value, options}))
            .then(function () {
                const state = getState();
                const {blurredTooFast, valid} = state;
                if (valid === false || blurredTooFast) {
                    return dispatch (validateInput(state))
                    }
            })
            .catch((e) => dispatch({type: DID_CANCEL_FETCH}))
            .finally(() => dispatch({type: DID_END_DEBOUNCED_CHANGE}));
    },
    300
)

export function changeInput(value) {
    return function (dispatch, getState) {
        return Promise
            .try(() => dispatch({type: WILL_START_CHANGE}))
              .then(() => debouncedChangeInput(value, getState, dispatch))
    }
}

export function blurInput() {
    return function (dispatch, getState) {
        const state = getState();
        const {pendingDebounceDuration, numberOfPendingDebouncedChanges} = state;

        if (!pendingDebounceDuration && numberOfPendingDebouncedChanges === 0) {
            return dispatch(validateInput(state));
        }

        return dispatch({type: DID_BLUR_BEFORE_FETCH_COMPLETED, value: true});
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
                pendingDebounceDuration: true
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
            console.log(`changing ${state.value} to ${action.value}`)
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