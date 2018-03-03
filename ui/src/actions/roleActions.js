import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';


export const suggestRoles = asyncActionCreator((prefix, exclude) => async dispatch => {
  const response = await endpoint.get(`roles/_suggest`, {params: {prefix, exclude}});
  return response.data;
}, { name: 'SUGGEST_ROLES' });

export const fetchRole = asyncActionCreator((id) => async dispatch => {
  const response = await endpoint.get(`roles/${id}`);
  return { role: response.data };
}, { name: 'FETCH_ROLE' });

export const addRole = asyncActionCreator((role) => async dispatch => {
  const response = await endpoint.post(`roles/${role.id}`, role);
  return {role: response.data};
}, {name: 'ADD_ROLE'});