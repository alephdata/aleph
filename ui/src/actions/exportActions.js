// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { endpoint } from "src/app/api";
import Query from 'app/Query';
import asyncActionCreator from "./asyncActionCreator";

export const fetchExports = asyncActionCreator(
  () => async () => {
    const params = { limit: Query.MAX_LIMIT };
    const response = await endpoint.get("exports", { params });
    return { exports: response.data };
  },
  { name: "FETCH_EXPORTS" }
);

export const triggerQueryExport = asyncActionCreator(exportLink => async () => {
  const response = await endpoint.post(exportLink, {}, {});
  return { data: response.data };
}, { name: 'TRIGGER_QUERY_EXPORT' });
