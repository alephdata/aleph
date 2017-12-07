// A global counter, to ensure we generate unique names for nameless functions.
let counter = 1;

export default function asyncActionCreator(actionCreator, {
  name = actionCreator.name || `asyncAction_${counter++}`,
  START = `${name}_START`,
  ERROR = `${name}_ERROR`,
  COMPLETE = `${name}_COMPLETE`,
} = {}) {
  const newActionCreator = (...args) => async function (dispatch) {
    const action = actionCreator(...args);
    dispatch({
      type: START,
      payload: args,
    });
    try {
      const valueOrPromise = dispatch(action);
      const value = await valueOrPromise;
      dispatch({
        type: COMPLETE,
        payload: value,
      });
    } catch (error) {
      dispatch({
        type: ERROR,
        payload: error,
      });
    }
  }
  Object.defineProperty(newActionCreator, 'name', { value: name });
  newActionCreator.innerFunc = actionCreator;

  newActionCreator.START = START;
  newActionCreator.COMPLETE = COMPLETE;
  newActionCreator.ERROR = ERROR;

  return newActionCreator;
}
