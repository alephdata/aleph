import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';

export const queryProcessingTaskReports = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_PROCESSING_TASK_REPORTS' },
);

export const deleteProcessingJobReport = asyncActionCreator(id => async () => {
  await endpoint.delete(`reports/delete/${id}`);
  return true;
}, { name: 'DELETE_PROCESSING_JOB_REPORT' });

export const triggerTaskReprocess = asyncActionCreator(tasks => async () => {
  await endpoint.post('reports/reprocess', { tasks });
  return true;
}, { name: 'TRIGGER_TASK_REPROCESS' });
