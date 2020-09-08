import { endpoint } from "src/app/api";
import asyncActionCreator from "./asyncActionCreator";
import { MAX_RESULTS } from "./util";

export const fetchExports = asyncActionCreator(
  () => async () => {
    const params = { limit: MAX_RESULTS };
    const response = await endpoint.get("exports", { params });
    return { exports: response.data };
  },
  { name: "FETCH_EXPORTS" }
);

export const triggerQueryExport = asyncActionCreator(exportLink => async () => {
  const response = await endpoint.post(exportLink, {}, {});
  return { data: response.data };
}, { name: 'TRIGGER_QUERY_EXPORT' });
