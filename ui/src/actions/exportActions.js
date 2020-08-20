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
