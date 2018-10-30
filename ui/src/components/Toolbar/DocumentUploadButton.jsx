import React from 'react';
import { FormattedMessage } from 'react-intl';

import DocumentUploadDialog from "src/dialogs/DocumentUploadDialog/DocumentUploadDialog";

class DocumentUploadButton extends React.Component {
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
    const { collection, parent } = this.props;
    const parentFolder = parent == null ? true : parent.schema === 'Folder';

    if (!parentFolder || !collection.writeable || !collection.casefile) {
      return null;
    }

    return (
      <React.Fragment>
        <a onClick={this.toggleUpload} className="bp3-button">
          <span className="bp3-icon-standard bp3-icon-upload"/>
          <FormattedMessage id="document.upload.button" defaultMessage="Upload"/>
        </a>
        <DocumentUploadDialog collection={collection}
                              parent={parent}
                              isOpen={this.state.isUploadOpen}
                              toggleDialog={this.toggleUpload} />
      </React.Fragment>
    );
  }
}

export default DocumentUploadButton;