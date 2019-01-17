import React from "react";
import {connect} from "react-redux";
import {blurInput, changeInput, focusInput} from './input';

function mapStateToProps(state) {
    return {
        blurredTooFast: state.blurredTooFast,
        isLoading: state.isLoading,
        options: state.options,
        valid: state.valid,
        value: state.value
    };
}

const mapDispatchToProps = {
    blurInput,
    changeInput,
    focusInput
};

function App ({blurredTooFast, isLoading, valid, value, options, blurInput, changeInput, focusInput}) {
    function validationMessage (valid) {
        switch(valid) {
            case true:
                return 'valid';
            case false:
                return 'invalid'
            default:
                return 'not yet validated'
        }
    }

    return (
        <div>
            <h3>The correct values are 'apple', 'car', 'cart', and 'zebra</h3>
            <p>{validationMessage(valid)}</p>
            <input
                onFocus={() => focusInput()}
                onChange={(e) => changeInput(e.target.value)}
                onBlur={() => blurInput()}
            />
            {isLoading ? <p>Loading...</p> : null}
            <hr/>
            <div>
                <pre>{JSON.stringify({blurredTooFast, value, isLoading, valid, options}, null, 3)}</pre>
            </div>
        </div>

    )
}

export default connect(mapStateToProps, mapDispatchToProps)(App);