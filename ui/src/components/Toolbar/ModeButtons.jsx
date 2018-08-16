import React from 'react';
import { withRouter } from 'react-router';

import { DownloadButton, DocumentUploadButton, DocumentFolderButton } from 'src/components/Toolbar';

class ModeButtons extends React.Component {
  render() {
    const { document } = this.props;

    return (
      <div className="pt-button-group">
        <DocumentFolderButton collection={document.collection} parent={document} />
        <DocumentUploadButton collection={document.collection} parent={document} />
        <DownloadButton document={document} />
      </div>
    );
  }
}

ModeButtons = withRouter(ModeButtons);
export default ModeButtons;