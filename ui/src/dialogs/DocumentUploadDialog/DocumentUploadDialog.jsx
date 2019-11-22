import React, { Component } from 'react';
import {
  Button, Dialog, Intent, ProgressBar,
} from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { ingestDocument as ingestDocumentAction } from 'src/actions';
import { showErrorToast } from 'src/app/toast';
import wordList from 'src/util/wordList';

import './DocumentUploadDialog.scss';


const messages = defineMessages({
  title: {
    id: 'document.upload.title',
    defaultMessage: 'Upload documents',
  },
  save: {
    id: 'document.upload.save',
    defaultMessage: 'Upload',
  },
  choose_file: {
    id: 'document.upload.choose_file',
    defaultMessage: 'Choose files to upload...',
  },
  success: {
    id: 'document.upload.success',
    defaultMessage: 'Documents are being processed...',
  },
  error: {
    id: 'document.upload.error',
    defaultMessage: 'There was an error while uploading the file.',
  },
});


export class DocumentUploadDialog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      files: props.filesToUpload || [],
      percentCompleted: 0,
      uploadingFile: null,
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onFilesChange = this.onFilesChange.bind(this);
    this.onUploadProgress = this.onUploadProgress.bind(this);
  }

  onFilesChange(event) {
    this.setState({ files: Array.from(event.target.files) });
  }

  async onFormSubmit(event) {
    event.preventDefault();
    const {
      intl, collection, parent, ingestDocument, toggleDialog,
    } = this.props;
    const { files } = this.state;
    try {
      const ingestPromises = [];
      files.forEach((file) => {
        this.setState({ percentCompleted: 0, uploadingFile: file });
        const metadata = {
          file_name: file.name,
          mime_type: file.type,
        };
        if (parent && parent.id) {
          metadata.parent_id = parent.id;
        }
        ingestPromises.push(ingestDocument(collection.id, metadata, file, this.onUploadProgress));
      });
      await Promise.all(ingestPromises);
      toggleDialog();
    } catch (e) {
      showErrorToast(intl.formatMessage(messages.error));
    }
  }

  onUploadProgress(progressEvent) {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    this.setState({ percentCompleted });
  }

  render() {
    const { intl, toggleDialog, isOpen } = this.props;
    const { percentCompleted, uploadingFile, files } = this.state;
    const fileNames = files.map(file => file.name);

    return (
      <Dialog
        icon="upload"
        className="DocumentUploadDialog"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={toggleDialog}
      >
        { uploadingFile && (
          <div className="bp3-dialog-body">
            <p>
              <FormattedMessage
                id="document.upload.progress"
                defaultMessage="Uploading: {file}..."
                values={{ file: uploadingFile.name }}
              />
            </p>
            <ProgressBar
              value={percentCompleted}
              animate={false}
              stripes={false}
              className="bp3-intent-success document-upload-progress-bar"
            />
            <p className="text-muted">
              <FormattedMessage
                id="document.upload.notice"
                defaultMessage="Once the upload is complete, it will take a few moments for the document to be processed and become searchable."
              />
            </p>
          </div>
        )}
        { !uploadingFile && (
          <form onSubmit={this.onFormSubmit}>
            <div className="bp3-dialog-body">
              <div className="bp3-form-group">
                <div className="bp3-input-group bp3-large bp3-fill">
                  <label
                    className="bp3-file-input bp3-large bp3-fill"
                    htmlFor="document-upload-input"
                  >
                    <input
                      id="document-upload-input"
                      type="file"
                      multiple
                      className="bp3-large bp3-fill"
                      onChange={this.onFilesChange}
                    />
                    <span className="bp3-file-upload-input">
                      {wordList(fileNames, ', ')}
                      { fileNames.length === 0 && intl.formatMessage(messages.choose_file)}
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <div className="bp3-dialog-footer">
              <div className="bp3-dialog-footer-actions">
                <Button
                  type="submit"
                  intent={Intent.PRIMARY}
                  text={intl.formatMessage(messages.save)}
                />
              </div>
            </div>
          </form>
        )}
      </Dialog>
    );
  }
}
const mapDispatchToProps = { ingestDocument: ingestDocumentAction };

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl,
)(DocumentUploadDialog);
