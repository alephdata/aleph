import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';


export const fetchProfile = asyncActionCreator(({ id }) => async () => {
    const response = await endpoint.get(`profiles/${id}`);
    return { id, data: response.data };
}, { name: 'FETCH_PROFILE' });

export const fetchProfileTags = asyncActionCreator(({ id }) => async () => {
    const response = await endpoint.get(`profiles/${id}/tags`);
    return { id, data: response.data };
}, { name: 'FETCH_PROFILE_TAGS' });

export const pairwiseJudgement = asyncActionCreator(({ entity, match, judgement }) => async () => {
    const data = { entity_id: entity.id, match_id: match.id, judgement };
    const response = await endpoint.post('profiles/_pairwise', data);
    entity.profile_id = response.data.profile_id;
    return { entity, match, judgement };
}, { name: 'PAIRWISE_JUDGEMENT' });
