import React from "react";
import {connect} from "react-redux";
import {blurInput, changeInput} from './input';

function mapStateToProps(state) {
    return {
        isLoading: state.isLoading,
        valid: state.valid,
        value: state.value
    };
}

const mapDispatchToProps = {
    blurInput,
    changeInput
};

function App ({isLoading, valid, blurInput, changeInput}) {
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
            <h3>The only correct value is 'a'</h3>
            <p>{validationMessage(valid)}</p>
            <input
                onChange={(e) => changeInput(e.target.value)}
                onBlur={() => blurInput()}
            />
            {isLoading ? <p>Loading...</p> : null}
        </div>
    )
}

export default connect(mapStateToProps, mapDispatchToProps)(App);