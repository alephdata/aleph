import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';

export const queryReports = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_REPORTS' },
);

export const deleteJobReport = asyncActionCreator(id => async () => {
  await endpoint.delete(`reports/delete/${id}`);
  return true;
}, { name: 'DELETE_JOB_REPORT' });

export const triggerReprocessing = asyncActionCreator(tasks => async () => {
  await endpoint.post('reports/reprocess', { tasks });
  return true;
}, { name: 'TRIGGER_TASK_REPROCESS' });
