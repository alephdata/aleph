import React, { Component } from 'react';
import { Button, Dialog, Icon, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Dropzone from 'react-dropzone';

import './DiagramImport.scss';

const messages = defineMessages({
  title: {
    id: 'diagram.import.title',
    defaultMessage: 'Diagram import',
  },
});

class DiagramImport extends Component {
  constructor(props) {
    super(props);

    this.onDrop = this.onDrop.bind(this);
  }

  onDrop([file]) {
    console.log(file);
    const fileName = file.name;
    const label = fileName.match(/^([^.]+)/)[0];
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = (e.target.result)
      console.log(data)
      this.props.onImport({ fileName, label, layout: JSON.parse(data).layout })
    };
    reader.readAsText(file);
  }

  render() {
    const { importedFile } = this.props;

    return (
      <Dropzone
        accept='.vis'
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
              <a className="DiagramImport__file-name">
                <Icon icon="document-open" iconSize={14} />
                <span>{importedFile}</span>
              </a>
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
