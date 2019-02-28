import React from 'react';

import { Schema, Entity } from 'src/components/common';


function DocumentHeading(props) {
  const { document } = props;

  return (
    <React.Fragment>
      <div className="pane-heading">
        <span>
          <Schema.Label schema={document.schema} icon />
        </span>
        <h1>
          <Entity.Label entity={document} addClass />
        </h1>
      </div>
    </React.Fragment>
  );
}

export default DocumentHeading;
