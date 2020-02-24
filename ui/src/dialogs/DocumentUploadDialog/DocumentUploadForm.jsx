import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import DocumentUploadInput from './DocumentUploadInput';

import './DocumentUploadForm.scss';

const messages = defineMessages({
  choose_file: {
    id: 'document.upload.choose_file',
    defaultMessage: 'Select files to upload',
  },
  choose_folder: {
    id: 'document.upload.choose_folder',
    defaultMessage: 'Select folders to upload',
  },
  input_or: {
    id: 'document.upload.input_or',
    defaultMessage: 'or',
  },
});


export class DocumentUploadForm extends PureComponent {
  onFilesChange(event) {
    const files = Array.from(event.target.files).filter(file => file.type !== '');

    this.props.onFilesChange(files);
  }

  render() {
    const { intl } = this.props;

    return (
      <div className="DocumentUploadForm">
        <DocumentUploadInput
          type="file"
          placeholder={intl.formatMessage(messages.choose_file)}
          onFilesChange={files => this.onFilesChange(files)}
        />
        <span className="DocumentUploadForm__divider">
          {intl.formatMessage(messages.input_or)}
        </span>
        <DocumentUploadInput
          type="folder"
          placeholder={intl.formatMessage(messages.choose_folder)}
          onFilesChange={files => this.onFilesChange(files)}
        />
      </div>
    );
  }
}

export default injectIntl(DocumentUploadForm);
