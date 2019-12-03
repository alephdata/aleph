import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';


export const fetchCollectionDiagrams = asyncActionCreator((collectionId) => async () => {
  const response = await endpoint.get(`collections/${collectionId}/diagrams`);
  return { data: response.data.results };
}, { name: 'FETCH_COLLECTION_DIAGRAMS' });

export const fetchCollectionDiagram = asyncActionCreator((collectionId, diagramId) => async () => {
  const response = await endpoint.get(`collections/${collectionId}/diagrams/${diagramId}`);
  return { diagramId, data: response.data.results };
}, { name: 'FETCH_COLLECTION_DIAGRAM' });

export const createCollectionDiagram = asyncActionCreator((collectionId, diagram) => async () => {
  const response = await endpoint.post(`collections/${collectionId}/diagrams`, diagram);
  const diagramId = response.data.id;
  return { diagramId, data: [response.data] };
}, { name: 'CREATE_COLLECTION_DIAGRAM' });

export const updateCollectionDiagram = (
  asyncActionCreator((collectionId, diagramId, diagram) => async () => {
    const response = await endpoint.put(`collections/${collectionId}/diagrams/${diagramId}`, diagram);
    return { diagramId, data: [response.data] };
  }, { name: 'UPDATE_COLLECTION_DIAGRAM' })
);

export const deleteCollectionDiagram = asyncActionCreator((collectionId, diagramId) => async () => {
  await endpoint.delete(`collections/${collectionId}/diagrams/${diagramId}`);
  return { diagramId };
}, { name: 'DELETE_COLLECTION_DIAGRAM' });
