/* eslint no-unused-vars: "off" */
/* global offline */
const initialState = {
    count: 0,
    transactions: [],
    loggedIn: false,
    policies: [],
    isLoading: false,
    tabSelected: 0,
    tabsOptions: []
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
        case 'ADD_CLAIM':
            let addClaimObj = {};

            addClaimObj[action.claimId] = action.claim;

            newState = Object.assign({}, state, {
                claims: Object.assign({}, state.claims, addClaimObj),
            });
            break;
        case 'SET_POLICIES':

            newState = Object.assign({}, state, {
                policies: action.policies,
            });
            break;
        case 'SET_CLAIMS':
            let newClaimsObject = action.claims.reduce(function (final, current) {
                final[current.id] = current;
                return final;
            }, {});
            newState = Object.assign({}, state, {
                claims: newClaimsObject,
                isLoading: false
            });
            break;
        case 'SET_TABS_SELECTED':
            newState = Object.assign({}, state, {
                tabSelected: action.selected
            });
            break;
        case 'SET_TABS_OPTIONS':
            newState = Object.assign({}, state, {
                tabsOptions: action.options
            });
            break;
        case 'SET_TOKEN':
            newState = Object.assign({}, state, {
                token: action.token ,
                username: action.username,
                loggedIn: true,
            });
            break;

        case 'SET_LOADING':
            console.log(action.isLoading);
            newState = Object.assign({}, state, {
                isLoading: action.isLoading
            });
            break;

        case 'SET_PUSH_TOKEN':
            newState = Object.assign({}, state, {
                pushToken: action.pushToken,
            });
            break;

        case 'LOG_OUT':
            newState = Object.assign({},
            initialState );
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