import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import { URL, DualPane, Schema, Entity } from 'src/components/common';
import { DocumentMetadata } from 'src/components/Document';
import { CollectionOverview } from 'src/components/Collection';


class DocumentInfoMode extends React.Component {
  render() {
    const { document } = this.props;

    return (
      <DualPane.InfoPane className="DocumentInfo with-heading">
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
          <span className="source-header">
            <FormattedMessage id="entity.info.source" defaultMessage="Source"/>
          </span>
          <CollectionOverview collection={document.collection} hasHeader={true}/>
        </div>
      </DualPane.InfoPane>
    );
  }
}

export default DocumentInfoMode;
