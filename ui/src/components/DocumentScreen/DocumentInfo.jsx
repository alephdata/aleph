import React, { Component } from 'react';
import { connect } from 'react-redux';
import { AnchorButton } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';

import Entity from 'src/components/EntityScreen/Entity';
import DualPane from 'src/components/common/DualPane';
import DocumentMetadata from 'src/components/DocumentScreen/DocumentMetadata';
import CollectionCard from 'src/components/CollectionScreen/CollectionCard';

class DocumentInfo extends Component {
  render() {
    const { document, session } = this.props;

    return (
      <DualPane.InfoPane>
        <h1>
          <Entity.Label entity={document} />
        </h1>
        <DocumentMetadata document={document} />

        {document.links && document.links.file &&
          <div className="pt-button-group pt-fill">
            <AnchorButton
              href={session.token ? `${document.links.file}?api_key=${session.token}` : document.links.file}
              download={document.file_name}>
              Download
            </AnchorButton>
          </div>
        }

        <h3>
          <FormattedMessage id="collection.section" defaultMessage="Origin"/>
        </h3>
        <CollectionCard collection={document.collection} />

      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {session: state.session};
}
export default connect(mapStateToProps)(DocumentInfo);
