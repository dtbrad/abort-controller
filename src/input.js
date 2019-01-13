import debounce from 'lodash/debounce';

const Promise = require("bluebird");
const DID_BEGIN_LOADING = 'DID_BEGIN_LOADING';
const DID_END_LOADING = 'DID_END_LOADING';
const DID_CHANGE_INPUT = 'DID_CHANGE_INPUT';
const DID_BLUR_BEFORE_FETCH_COMPLETED = 'DID_BLUR_BEFORE_FETCH_COMPLETED';
const DID_VALIDATE_INPUT = 'DID_VALIDATE_INPUT';
const DID_CANCEL_FETCH = 'DID_CANCEL_FETCH';

const initialState = {
    blurredTooFast: false,
    isLoading: false,
    value: "",
    valid: null
}

let controller;
let signal;

function fetchOptions (value, signal) {
    const validationQueryUrl = `http://localhost:3001/words?value=${value}`
    return fetch(validationQueryUrl, {signal})
        .then(function(response) {
            return response.json()
        })
}

function validateInput(state) {
    const {value, options} = state;
    const filteredOptions = options && options.filter(
            (option) => option.value.toLowerCase().includes(value.toLowerCase())
        );
    const valid = filteredOptions && !!filteredOptions.length;
    return {
        type: DID_VALIDATE_INPUT, valid
    }
}

const debouncedChangeInput = debounce(
    function changeInputBase(value, getState, dispatch) {
        if (controller) {
            controller.abort();
        }

        controller = new AbortController();
        ({signal} = controller);

        return Promise
            .try(() => fetchOptions(value, signal))
            .then((options) => dispatch({type: DID_CHANGE_INPUT, value, options}))
            .then(function () {
                const state = getState();
                const {blurredTooFast, valid} = state;
                if (valid === false || blurredTooFast) {
                    return dispatch (validateInput(state))
                    }
                })
            .then(() => dispatch({type: DID_END_LOADING, value: false}))
            .catch((e) => dispatch({type: DID_CANCEL_FETCH}))
    },
    300
)

export function changeInput(value) {
    return function (dispatch, getState) {
        const state = getState();
        const isLoading = state.isLoading;
        return Promise
            .try(() => !isLoading && dispatch({type: DID_BEGIN_LOADING, value: true}))
            .then(() => debouncedChangeInput(value, getState, dispatch))
    }
}

export function blurInput () {
    return function (dispatch, getState) {
        const state = getState();
        const {isLoading} = state;

        if (isLoading === false) {
            return dispatch(validateInput(state));
        }

        return dispatch({type: DID_BLUR_BEFORE_FETCH_COMPLETED, value: true});
    }
}

export default function reducer (state = initialState, action) {
    switch (action.type) {
        case DID_BEGIN_LOADING:
        case DID_END_LOADING:
            return {
                ...state,
                isLoading: action.value
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