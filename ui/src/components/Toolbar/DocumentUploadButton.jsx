import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';

import DocumentUploadDialog from 'src/dialogs/DocumentUploadDialog/DocumentUploadDialog';

class DocumentUploadButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isUploadOpen: false,
    };
    this.toggleUpload = this.toggleUpload.bind(this);
  }

  toggleUpload() {
    this.setState(({ isUploadOpen }) => ({ isUploadOpen: !isUploadOpen }));
  }

  render() {
    const { collection, parent } = this.props;
    const parentFolder = parent == null ? true : parent.schema.isA('Folder');

    if (!parentFolder || !collection.writeable) {
      return null;
    }

    return (
      <>
        <Button onClick={this.toggleUpload} icon="upload">
          <FormattedMessage id="document.upload.button" defaultMessage="Upload" />
        </Button>
        <DocumentUploadDialog
          collection={collection}
          parent={parent}
          isOpen={this.state.isUploadOpen}
          toggleDialog={this.toggleUpload}
        />
      </>
    );
  }
}

export default DocumentUploadButton;
