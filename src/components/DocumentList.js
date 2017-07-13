import React from 'react';

import Document from './Document'

const DocumentList = ({ results, isFetching }) => (
  <div>
    { isFetching && <div className='spinner'>Loading...</div> }
    <ul>
      {results.map(doc =>
        <Document
          key={doc.id}
          {...doc}
        />
      )}
    </ul>
  </div>
);

export default DocumentList;
