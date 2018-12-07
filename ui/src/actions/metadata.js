import asyncActionCreator from "./asyncActionCreator";
import {endpoint} from "src/app/api";
import Model from "src/followthemoney/model.ts";

export const fetchMetadata = asyncActionCreator(
  () => {
    return async dispatch => {
      const response = await endpoint.get('metadata');
      const {schemata, ...metadata} = response.data;
      const model = new Model(schemata);
      return {
        metadata: {
          ...metadata,
          schemata: model.getInstance()
        }
      };
    }
  },
  {name: 'FETCH_METADATA'}
);

export const fetchStatistics = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('statistics');
  return {statistics: response.data};
}, {name: 'FETCH_STATISTICS'});
