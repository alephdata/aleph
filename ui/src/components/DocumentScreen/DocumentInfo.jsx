import React, { Component } from 'react';
import { AnchorButton } from '@blueprintjs/core';

import Entity from 'src/components/EntityScreen/Entity';
import DualPane from 'src/components/common/DualPane';
import DocumentMetadata from 'src/components/DocumentScreen/DocumentMetadata';
import CollectionSection from 'src/components/CollectionScreen/CollectionSection';

class DocumentInfo extends Component {
  render() {
    const { document } = this.props;
    const hasTitle = !!document.title;
    return (
      <DualPane.InfoPane>
        <h1>
          <Entity.Label entity={document} />
        </h1>
        <DocumentMetadata document={document} />
        {document.links && document.links.file &&
          <AnchorButton
            href={document.links.file}
            download={document.file_name}
            intent="primary"
          >
            Download
          </AnchorButton>
        }

        {document.collection &&
          <CollectionSection collection={document.collection} />
        }
      </DualPane.InfoPane>
    );
  }
}

export default DocumentInfo;
