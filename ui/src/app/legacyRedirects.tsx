import { FC } from 'react';
import { Params, Navigate, Route, useParams } from 'react-router-dom';

type RedirectProps = {
  to: string | ((params: Params) => string);
};

type RedirectsMap = {
  [key: string]: RedirectProps['to'];
};

// We changed our routes a couple of times in the past. To ensure deep links from
// external tools, we try to redirect to the relevant new routes if possible.
const redirects: RedirectsMap = {
  'text/:documentId': ({ documentId }) => `/entities/${documentId}`,
  'tabular/:documentId/:sheet': ({ documentId }) => `/entities/${documentId}`,
  'documents/:documentId': ({ documentId }) => `/entities/${documentId}`,
  cases: '/investigations',
  sources: '/datasets',
  'collections/:collectionId/documents': ({ collectionId }) =>
    `/datasets/${collectionId}`,
  'collections/:collectionId': ({ collectionId }) =>
    `/datasets/${collectionId}`,
  'collections/:collectionId/xref/:otherId': ({ collectionId, otherId }) =>
    `/datasets/${collectionId}?xreffilter:match_collection_id=${otherId}#mode=xref`,
  'datasets/:collectionId/xref/:otherId': ({ collectionId, otherId }) =>
    `/datasets/${collectionId}?xreffilter:match_collection_id=${otherId}#mode=xref`,
};

const Redirect: FC<RedirectProps> = ({ to }) => {
  const params = useParams();
  to = typeof to === 'string' ? to : to(params);
  return <Navigate replace to={to} />;
};

export const routes = Object.entries(redirects).map(([path, to], index) => (
  <Route key={index} path={path} element={<Redirect to={to} />} />
));
