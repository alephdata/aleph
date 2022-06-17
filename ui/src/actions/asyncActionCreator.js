// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

// A global counter, to ensure we generate unique names for nameless functions.
let counter = 1;

/* Wraps an action creator in order to dispatch two extra actions: one just
 * before dispatching the action, and one when dispatching has either completed
 * or erred.
 */
export default function asyncActionCreator(actionCreator, {
  name = actionCreator.name || `asyncAction_${counter += 1}`,
  START = `${name}_START`,
  ERROR = `${name}_ERROR`,
  COMPLETE = `${name}_COMPLETE`,
} = {}) {
  const newActionCreator = (payload, ...otherArgs) => async function actionDispatch(dispatch) {
    const action = actionCreator(payload, ...otherArgs);
    dispatch({
      type: START,
      payload,
    });
    try {
      const valueOrPromise = dispatch(action);
      const value = await valueOrPromise;
      dispatch({
        type: COMPLETE,
        payload: value,
      });
      return value;
    } catch (error) {
      dispatch({
        type: ERROR,
        payload: { error, args: payload },
      });
      throw error;
    }
  };

  if (Object.getOwnPropertyDescriptor(newActionCreator, 'name').configurable) {
    Object.defineProperty(newActionCreator, 'name', { value: name });
  } else {
    Object.assign(newActionCreator, { toString: () => name });
  }
  newActionCreator.innerFunc = actionCreator;
  newActionCreator.START = START;
  newActionCreator.COMPLETE = COMPLETE;
  newActionCreator.ERROR = ERROR;
  return newActionCreator;
}
