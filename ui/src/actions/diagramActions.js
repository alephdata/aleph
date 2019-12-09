import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryDiagrams = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_DIAGRAMS' });


export const fetchDiagrams = asyncActionCreator(() => async () => {
  const response = await endpoint.get('/diagrams');
  return { data: response.data };
}, { name: 'FETCH_DIAGRAMS' });

export const fetchCollectionDiagrams = asyncActionCreator((collectionId) => async () => {
  const response = await endpoint.get(`collections/${collectionId}/diagrams`);
  return { data: response.data.results };
}, { name: 'FETCH_COLLECTION_DIAGRAMS' });

export const fetchDiagram = asyncActionCreator((diagramId) => async () => {
  const response = await endpoint.get(`diagrams/${diagramId}`);
  return { diagramId, data: response.data };
}, { name: 'FETCH_DIAGRAM' });

export const createDiagram = asyncActionCreator((diagram) => async () => {
  const response = await endpoint.post('diagrams', diagram);
  const diagramId = response.data.id;
  return { diagramId, data: response.data };
}, { name: 'CREATE_DIAGRAM' });

export const updateDiagram = (
  asyncActionCreator((diagramId, diagram) => async () => {
    const response = await endpoint.put(`diagrams/${diagramId}`, diagram);
    return { diagramId, data: response.data };
  }, { name: 'UPDATE_DIAGRAM' })
);

export const deleteDiagram = asyncActionCreator((diagramId) => async () => {
  await endpoint.delete(`diagrams/${diagramId}`);
  return { diagramId };
}, { name: 'DELETE_DIAGRAM' });
