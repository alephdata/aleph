import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';


export const fetchProfile = asyncActionCreator(({ id }) => async () => {
    const response = await endpoint.get(`profiles/${id}`);
    return { id, data: response.data };
}, { name: 'FETCH_PROFILE' });
