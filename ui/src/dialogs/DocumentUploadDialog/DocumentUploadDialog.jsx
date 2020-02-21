import React, { Component } from 'react';
import {
  Classes, Dialog,
} from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { ingestDocument as ingestDocumentAction } from 'src/actions';
import { showErrorToast } from 'src/app/toast';
import convertPathsToTree from 'src/util/convertPathsToTree';
import DocumentUploadForm from './DocumentUploadForm';
import DocumentUploadStatus from './DocumentUploadStatus';
import DocumentUploadView from './DocumentUploadView';


import './DocumentUploadDialog.scss';


const messages = defineMessages({
  title: {
    id: 'document.upload.title',
    defaultMessage: 'Upload documents',
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
      uploading: null,
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onFilesChange = this.onFilesChange.bind(this);
    this.onUploadProgress = this.onUploadProgress.bind(this);
  }

  onFilesChange(files) {
    this.setState({ files });
  }

  async onFormSubmit(files) {
    const {
      intl, parent, toggleDialog,
    } = this.props;

    // console.log('parent is', parent);

    const fileTree = convertPathsToTree(files);

    try {
      await this.traverseFileTree(fileTree, parent);
      // Promise.all(promises).then(() => {
      //   console.log('finished, toggling dialog', this.state);
      // });
      console.log('finished, toggling dialog', this.state);

      toggleDialog();

    } catch (e) {
      console.log('error!', e);
      showErrorToast(intl.formatMessage(messages.error));
    }
  }

  onUploadProgress(progressEvent) {
    // console.log('in on upload progress')
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    this.setState({ percentCompleted });
  }

  async traverseFileTree(tree, parent) {
    const filePromises = [];
    Object.entries(tree).map(([key, value]) => {
      let promise;
      if (value instanceof File) {
        promise = this.uploadFile(value, parent);
      } else {
        promise = new Promise((resolve, reject) => {
          this.uploadFolder(key, parent).then(async ({ id }) => {
            await this.traverseFileTree(value, { id, foreign_id: key });
            resolve();
          })
        });
      }

      filePromises.push(promise);
    });

    await Promise.all(filePromises);
    return;
  }

  uploadFile(file, parent, filePromises) {
    const { collection, ingestDocument } = this.props;
    // console.log('uploading file', file, parent);
    this.setState({ percentCompleted: 0, uploading: file.name });

    const metadata = {
      file_name: file.name,
      mime_type: file.type,
    };
    if (parent?.id) {
      metadata.parent_id = parent.id;
    }
    return ingestDocument(collection.id, metadata, file, this.onUploadProgress);
  }

  uploadFolder(title, parent) {
    const { collection, ingestDocument } = this.props;
    this.setState({ percentCompleted: 0, uploading: title });

    const metadata = {
      file_name: title,
      foreign_id: title,
    };
    if (parent?.id) {
      metadata.foreign_id = `${parent.id}/${title}`;
      metadata.parent_id = parent.id;
    }

    return ingestDocument(collection.id, metadata, null, this.onUploadProgress);
  }


  renderContent() {
    const { files, percentCompleted, uploading } = this.state;

    if (uploading) {
      return (
        <DocumentUploadStatus
          percentCompleted={percentCompleted}
          uploading={uploading}
        />
      );
    }
    if (files && files.length) {
      return <DocumentUploadView files={files} onSubmit={this.onFormSubmit} />;
    }

    return <DocumentUploadForm onFilesChange={this.onFilesChange} />;
  }

  render() {
    const { intl, toggleDialog, isOpen } = this.props;

    return (
      <Dialog
        icon="upload"
        className="DocumentUploadDialog"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={toggleDialog}
      >
        <div className={Classes.DIALOG_BODY}>
          {this.renderContent()}
        </div>
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
