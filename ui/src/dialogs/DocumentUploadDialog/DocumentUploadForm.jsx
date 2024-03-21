import React, { PureComponent } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

import { showErrorToast } from 'src/app/toast';

import './DocumentUploadForm.scss';

const messages = defineMessages({
  file_rejected: {
    id: 'document.upload.rejected',
    defaultMessage:
      '{fileName} is missing a file type, so it cannot be uploaded.',
  },
});

export class DocumentUploadForm extends PureComponent {
  onFilesChange = (event) => {
    const { intl } = this.props;
    const rejectedFiles = [];

    const files = Array.from(event.target.files).filter((file) => {
      if (!file.type || file.type === '') {
        rejectedFiles.push(file);
        return false;
      }
      return true;
    });

    rejectedFiles.forEach((f) =>
      showErrorToast(
        intl.formatMessage(messages.file_rejected, { fileName: f.name })
      )
    );
    this.props.onFilesChange(files);
  };

  render() {
    return (
      <div className="DocumentUploadForm">
        <div className={c(Classes.INPUT_GROUP, Classes.LARGE, Classes.FILL)}>
          <label
            className={c(Classes.FILE_INPUT, Classes.LARGE, Classes.FILL)}
            htmlFor="file-input"
          >
            <input
              id="file-input"
              type="file"
              multiple
              onChange={this.onFilesChange}
            />
            <span className={Classes.FILE_UPLOAD_INPUT}>
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
        <p>
          <FormattedMessage
            id="document.upload.info"
            defaultMessage="If you need to upload a large amount of files (100+) consider {link}."
            values={{
              link: (
                <a href="https://docs.aleph.occrp.org/developers/alephclient/#importing-all-files-from-a-directory">
                  alephclient
                </a>
              ),
            }}
          />
        </p>
      </div>
    );
  }
}

export default injectIntl(DocumentUploadForm);
