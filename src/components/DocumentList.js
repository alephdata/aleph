import React from 'react';

import Document from './Document'

const DocumentList = ({ result }) => (
  <div>
    { result.isFetching && <div className='spinner'>Loading...</div> }
    <ul>
      {result.results.map(doc =>
        <Document
          key={doc.id}
          {...doc}
        />
      )}
    </ul>
  </div>
);

export default DocumentList;
