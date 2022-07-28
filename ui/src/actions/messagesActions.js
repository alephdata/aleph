import axios from 'axios';
import asyncActionCreator from 'actions/asyncActionCreator';

const MESSAGES_ENDPOINT =
  'https://tillprochaska.github.io/status-github-api/messages.json';

export const fetchMessages = asyncActionCreator(
  () => async () => {
    const response = await axios.get(MESSAGES_ENDPOINT);
    return { messages: response.data };
  },
  { name: 'FETCH_MESSAGES' }
);
