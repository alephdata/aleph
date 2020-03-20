import React, { PureComponent } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';

import './DocumentUploadForm.scss';


export class DocumentUploadForm extends PureComponent {
  onFilesChange = (event) => {
    const files = Array.from(event.target.files).filter(file => file.type !== '');

    this.props.onFilesChange(files);
  }

  render() {
    return (
      <div className="DocumentUploadForm">
        <div className="bp3-input-group bp3-large bp3-fill">
          <label
            className="bp3-file-input bp3-large bp3-fill"
            htmlFor="file-input"
          >
            <input
              id="file-input"
              type="file"
              multiple
              onChange={this.onFilesChange}
            />
            <span className="bp3-file-upload-input">
              <FormattedMessage
                id="document.upload.files"
                defaultMessage="Choose files to upload..."
              />
            </span>
          </label>
        </div>
        <p className="DocumentUploadForm__secondary">
          <FormattedMessage
            id="document.upload.folder"
            defaultMessage="If you would like to upload folders instead, { button }."
            values={{
              button: (
                <label
                  htmlFor="folder-input"
                  className="DocumentUploadForm__hidden-input__label"
                >
                  <input
                    id="folder-input"
                    type="file"
                    multiple
                    webkitdirectory=""
                    directory=""
                    onChange={this.onFilesChange}
                    className="DocumentUploadForm__hidden-input"
                  />
                  <FormattedMessage
                    id="document.upload.folder-toggle"
                    defaultMessage="click here"
                  />
                </label>
              ),
            }}
          />
        </p>
      </div>
    );
  }
}

export default injectIntl(DocumentUploadForm);
