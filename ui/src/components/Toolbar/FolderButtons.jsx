import React from 'react';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { ButtonGroup, Button, AnchorButton } from "@blueprintjs/core";

import DocumentUploadDialog from "src/dialogs/DocumentUploadDialog/DocumentUploadDialog";

// import './FolderButtons.css';

class FolderButtons extends React.Component {
  constructor() {
    super();
    this.state = {
      isUploadOpen: false
    };

    this.toggleUpload = this.toggleUpload.bind(this);
  }

  toggleUpload() {
    this.setState({isUploadOpen: !this.state.isUploadOpen})
  }

  render() {
    const { document } = this.props;
    const collection = document ? document.collection : this.props.collection;
    const isWriteable = document ? document.writeable : collection.writeable;

    if (!isWriteable) {
      return null;
    }

    return (
      <React.Fragment>
        <ButtonGroup className="FolderButtons" minimal={false}>
          <a onClick={this.toggleUpload} className="pt-button">
            <span className="pt-icon-standard pt-icon-upload"/>
            <FormattedMessage id="document.upload.button" defaultMessage="Upload"/>
          </a>
        </ButtonGroup>
        <DocumentUploadDialog collection={collection}
                              parent={document}
                              isOpen={this.state.isUploadOpen}
                              toggleDialog={this.toggleUpload} />
      </React.Fragment>
    );
  }
}

export default FolderButtons;