import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';

export const queryProfileExpand = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_PROFILE_EXPAND' }
);

export const fetchProfile = asyncActionCreator(
  ({ id }) =>
    async () => {
      const response = await endpoint.get(`profiles/${id}`);
      return { id, data: response.data };
    },
  { name: 'FETCH_PROFILE' }
);

export const fetchProfileTags = asyncActionCreator(
  ({ id }) =>
    async () => {
      const response = await endpoint.get(`profiles/${id}/tags`);
      return { id, data: response.data };
    },
  { name: 'FETCH_PROFILE_TAGS' }
);

export const pairwiseJudgement = asyncActionCreator(
  ({ entity, match, judgement }) =>
    async () => {
      const data = { entity_id: entity.id, match_id: match.id, judgement };
      const response = await endpoint.post('profiles/_pairwise', data);
      return { entityId: entity.id, profileId: response.data.profile_id };
    },
  { name: 'PAIRWISE_JUDGEMENT' }
);
