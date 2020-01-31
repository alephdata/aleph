import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { FormattedMessage, injectIntl } from 'react-intl';
import Dropzone from 'react-dropzone';

import './DiagramImport.scss';


class DiagramImport extends Component {
  constructor(props) {
    super(props);

    this.onDrop = this.onDrop.bind(this);
  }

  onDrop([file]) {
    const fileName = file.name;
    const label = fileName.match(/^([^.]+)/)[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = (e.target.result);
      this.props.onImport({ fileName, label, layout: JSON.parse(data).layout });
    };
    reader.readAsText(file);
  }

  render() {
    const { importedFile } = this.props;

    return (
      <Dropzone
        accept=".vis"
        onDrop={acceptedFiles => (
          acceptedFiles && acceptedFiles.length ? this.onDrop(acceptedFiles) : null
        )}
      >
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()}>
            <input
              {...getInputProps()}
            />
            {importedFile && (
              <Button
                className="DiagramImport__file-name"
                icon="document-open"
                text={importedFile}
                intent={Intent.PRIMARY}
                minimal
              />
            )}
            {!importedFile && (
              <div className="DiagramImport__placeholder">
                <FormattedMessage
                  id="diagramImport.placeholderText"
                  defaultMessage="Drop a .vis file here or click to import an existing diagram layout"
                />
              </div>
            )}
          </div>
        )}
      </Dropzone>
    );
  }
}

export default injectIntl(DiagramImport);
