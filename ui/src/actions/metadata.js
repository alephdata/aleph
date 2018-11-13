import asyncActionCreator from "./asyncActionCreator";
import {endpoint} from "src/app/api";
import {model, initialize} from "src/ftm/model.ts";

export const fetchMetadata = asyncActionCreator(
  () => {
    return async dispatch => {
      const response = await endpoint.get('metadata');
      const { schemata, ...metadata } = response.data;
      debugger;
      initialize(schemata);
      return { metadata: {
          ...metadata,
          schemata:model
        }};
    }
  },
  { name: 'FETCH_METADATA' }
);

export const fetchStatistics = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('statistics');
  return { statistics: response.data };
}, { name: 'FETCH_STATISTICS' });
