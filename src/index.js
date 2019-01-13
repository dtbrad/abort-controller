import React from "react";
import ReactDOM from "react-dom";
import {Provider} from "react-redux";
import {createStore, compose, applyMiddleware} from "redux";
import thunk from "redux-thunk";
import App from "./App";
import reducer from "./input";

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(reducer, composeEnhancer(applyMiddleware(thunk)));

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.querySelector("#root")
);
