import React, { PureComponent } from 'react';
import { Icon } from '@blueprintjs/core';

import './DocumentUploadInput.scss';


export class DocumentUploadInput extends PureComponent {
  render() {
    const { type, placeholder, onFilesChange } = this.props;

    const allowDirectories = type === 'folder';

    return (
      <div className="DocumentUploadInput">
        <input
          id={type}
          type="file"
          multiple
          webkitdirectory={allowDirectories ? '' : null}
          directory={allowDirectories ? '' : null}
          onChange={onFilesChange}
          className="DocumentUploadInput__hidden-input"
        />
        <label
          htmlFor={type}
          className="DocumentUploadInput__label bp3-button bp3-intent-primary"
        >
          <Icon icon={allowDirectories ? 'folder-shared' : 'document-share'} className="left-icon" />
          { placeholder }
        </label>
      </div>
    );
  }
}

export default DocumentUploadInput;
