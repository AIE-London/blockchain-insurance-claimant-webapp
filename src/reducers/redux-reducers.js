/* eslint no-unused-vars: "off" */
/* global offline */
const initialState = {
    count: 0,
    transactions: [],
    loggedIn: false
};
var reducers = function (state, action) {
    var save = true;
    if (!state) {
        state = initialState;
        save = false;
    }
    if (!action) {
        action = {};
    }
    var newState;
    switch (action.type) {
        case 'INCREMENT_COUNT':
            newState = Object.assign({}, state, {
                count: state.count + 1,
            });
            break;
        case 'RESTORE_CACHED':
            newState = Object.assign({}, state, action.cached);
            break;
        case 'ADD_TRANSACTIONS':
            let transArray = state.transactions;
            newState = Object.assign({}, state, {
                transactions: action.transactions,
            });
            break;
        case 'SET_TOKEN':
            newState = Object.assign({}, state, {
                token: action.token ,
                loggedIn: true,
            });
            break;

        default:
            newState = state;
            break;
    }
    if (save){
        offline.saveState(newState);
    }
    return newState;
};