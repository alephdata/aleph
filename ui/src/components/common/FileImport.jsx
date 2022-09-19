import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import Dropzone from 'react-dropzone';
import { showWarningToast } from 'app/toast';

import './FileImport.scss';

const messages = defineMessages({
  import_error: {
    id: 'file_import.error',
    defaultMessage: 'Error importing file',
  },
});

class FileImport extends Component {
  onDrop = (acceptedFiles) => {
    if (!acceptedFiles || !acceptedFiles.length) {
      return;
    }

    const { intl } = this.props;
    const file = acceptedFiles[0];
    const fileName = file.name;
    const label = fileName.match(/^([^.]+)/)[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target.result;
      this.props.onImport({ fileName, label, data });
    };
    reader.onerror = async () => {
      showWarningToast(intl.formatMessage(messages.import_error));
    };
    reader.readAsText(file);
  };

  render() {
    const { accept, importedFile, placeholder } = this.props;

    return (
      <Dropzone
        accept={accept}
        onDrop={this.onDrop}
        noDragEventsBubbling
        useFsAccessApi={false}
      >
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            {importedFile && (
              <Button
                className="FileImport__file-name"
                icon="document-open"
                text={importedFile}
                intent={Intent.PRIMARY}
                minimal
              />
            )}
            {!importedFile && (
              <div className="FileImport__placeholder">{placeholder}</div>
            )}
          </div>
        )}
      </Dropzone>
    );
  }
}

export default injectIntl(FileImport);
