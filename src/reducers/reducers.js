/**
 * Created by dan on 03/02/2017.
 */
const initialState = {
    count: 0
};

const reducer = function (state, action) {
    if (!state) {
        state = initialState;
    }
    if (!action) {
        action = {};
    }
    switch (action.type) {
        case 'INCREMENT_COUNT':
            return Object.assign({}, state, {
                counter: state.count++
            });
        default:
            return state
    }
};
