import React from 'react';

import Document from './Document'

const DocumentList = ({ documents, isFetching }) => (
  <div>
    { isFetching && <div className='spinner'>Loading...</div> }
    <ul>
      {documents.map(doc =>
        <Document
          key={doc.id}
          {...doc}
        />
      )}
    </ul>
  </div>
);

export default DocumentList;