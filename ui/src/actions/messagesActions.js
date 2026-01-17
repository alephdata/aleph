import axios from 'axios';
import asyncActionCreator from '/src/actions/asyncActionCreator.js';
import { createAction } from 'redux-act';

export const fetchMessages = asyncActionCreator(
  (endpoint) => async () => {
    const response = await axios.get(endpoint);
    return { messages: response.data };
  },
  { name: 'FETCH_MESSAGES' }
);

export const dismissMessage = createAction('DISMISS_MESSAGE');
