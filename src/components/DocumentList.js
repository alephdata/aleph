import React from 'react';

import Document from './Document'

const DocumentList = ({ items, isFetching }) => (
  <div>
    { isFetching && <div className='spinner'>Loading...</div> }
    <ul>
      {items.map(doc =>
        <Document
          key={doc.id}
          {...doc}
        />
      )}
    </ul>
  </div>
);

export default DocumentList;
