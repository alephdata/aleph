import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';


export const suggestRoles = asyncActionCreator((prefix, exclude) => async () => {
  const response = await endpoint.get('roles/_suggest', { params: { prefix, exclude } });
  return response.data;
}, { name: 'SUGGEST_ROLES' });

export const fetchRole = asyncActionCreator((id) => async () => {
  const response = await endpoint.get(`roles/${id}`);
  return { role: response.data };
}, { name: 'FETCH_ROLE' });

export const updateRole = asyncActionCreator((role) => async () => {
  const response = await endpoint.post(`roles/${role.id}`, role);
  return { role: response.data };
}, { name: 'UPDATE_ROLE' });

export const fetchGroups = asyncActionCreator(() => async () => {
  const response = await endpoint.get('groups');
  return { data: response.data };
}, { name: 'FETCH_GROUPS' });
