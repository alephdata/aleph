import React, { Component } from 'react';
import { AnchorButton } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';

import Entity from 'src/components/EntityScreen/Entity';
import DualPane from 'src/components/common/DualPane';
import DocumentMetadata from 'src/components/DocumentScreen/DocumentMetadata';
import CollectionCard from 'src/components/CollectionScreen/CollectionCard';
import DownloadIcon from '../../assets/download_icon.png';

import './DocumentInfo.css';

class DocumentInfo extends Component {
  render() {
    const { document } = this.props;
    
    return (
      <DualPane.InfoPane>
        <h1 className="document_info_border">
          <Entity.Label entity={document} addClass={true}/>
        </h1>
        <DocumentMetadata document={document} />

          {document.links && document.links.file &&
          <div className="pt-button-group pt-fill document_info_button">

              <AnchorButton
                  href={document.links.file}
                  download={document.file_name} className="document_info_anchor_button">
                  <i className="fa fa-download document_info_icon" aria-hidden="true"/>Download
              </AnchorButton>
          </div>
          }

        <h3 className="document_info_origin document_info_border">
          <FormattedMessage id="collection.section" defaultMessage="Origin"/>
        </h3>

          <div className="collection_card_document_info">
              <CollectionCard collection={document.collection} />
          </div>

      </DualPane.InfoPane>
    );
  }
}

export default DocumentInfo;
