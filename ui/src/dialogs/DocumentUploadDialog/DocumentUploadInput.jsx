import React, { PureComponent } from 'react';

import './DocumentUploadDialog.scss';


export class DocumentUploadInput extends PureComponent {
  render() {
    const { allowDirectories, id, placeholder, onFilesChange } = this.props;

    return (
      <div className="bp3-input-group bp3-large bp3-fill">
        <label
          className="bp3-file-input bp3-large bp3-fill"
          htmlFor={id}
        >
          <input
            id={id}
            type="file"
            multiple
            webkitdirectory={allowDirectories ? '' : null}
            directory={allowDirectories ? '' : null}
            onChange={onFilesChange}
          />
          <span className="bp3-file-upload-input">
            { placeholder}
          </span>
        </label>
      </div>
    );
  }
}

export default DocumentUploadInput;
