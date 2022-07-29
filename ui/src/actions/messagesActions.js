import axios from 'axios';
import asyncActionCreator from 'actions/asyncActionCreator';

export const fetchMessages = asyncActionCreator(
  (endpoint) => async () => {
    const response = await axios.get(endpoint);
    return { messages: response.data };
  },
  { name: 'FETCH_MESSAGES' }
);
