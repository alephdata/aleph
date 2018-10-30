import React from 'react';
import { FormattedMessage } from 'react-intl';

import DocumentFolderDialog from "src/dialogs/DocumentFolderDialog/DocumentFolderDialog";

class DocumentFolderButton extends React.Component {
  constructor() {
    super();
    this.state = {
      isFolderOpen: false
    };

    this.toggleFolder = this.toggleFolder.bind(this);
  }

  toggleFolder() {
    this.setState({isFolderOpen: !this.state.isFolderOpen})
  }

  render() {
    const { collection, parent } = this.props;
    const parentFolder = parent == null ? true : parent.schema === 'Folder';

    if (!parentFolder || !collection.writeable || !collection.casefile) {
      return null;
    }

    return (
      <React.Fragment>
        <a onClick={this.toggleFolder} className="bp3-button">
          <span className="bp3-icon-standard bp3-icon-folder-new"/>
          <FormattedMessage id="document.folder.button" defaultMessage="New folder"/>
        </a>
        <DocumentFolderDialog collection={collection}
                              parent={parent}
                              isOpen={this.state.isFolderOpen}
                              toggleDialog={this.toggleFolder} />
      </React.Fragment>
    );
  }
}

export default DocumentFolderButton;