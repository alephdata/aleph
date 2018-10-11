import React from 'react';

import { Schema, Entity } from 'src/components/common';
import { DocumentMetadata } from 'src/components/Document';


class DocumentInfoMode extends React.Component {
  render() {
    const { document } = this.props;

    return (
      <React.Fragment>
        <div className="pane-heading">
          <span>
            <Schema.Label schema={document.schema} icon={true}/>
          </span>
          <h1>
            <Entity.Label entity={document} addClass={true}/>
          </h1>
        </div>
        <div className="pane-content">
          <DocumentMetadata document={document}/>
        </div>
      </React.Fragment>
    );
  }
}

export default DocumentInfoMode;
