import React, { Component } from 'react';
import {
  Classes, Dialog,
} from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { ingestDocument as ingestDocumentAction } from 'actions';
import { showErrorToast, showSuccessToast } from 'app/toast';
import convertPathsToTree from 'util/convertPathsToTree';
import DocumentUploadForm from './DocumentUploadForm';
import DocumentUploadStatus from './DocumentUploadStatus';
import DocumentUploadView from './DocumentUploadView';


import './DocumentUploadDialog.scss';


const messages = defineMessages({
  title: {
    id: 'document.upload.title',
    defaultMessage: 'Upload Documents',
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
      currUploading: false,
      totalUploadSize: 0,
      uploadTraces: []
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onFilesChange = this.onFilesChange.bind(this);
  }

  onFilesChange(files) {
    this.setState({ files });
  }

  async onFormSubmit(files) {
    const {
      intl, onUploadSuccess, parent,
    } = this.props;

    const fileTree = convertPathsToTree(files);
    this.setState({
      currUploading: true,
      totalUploadSize: files.reduce((result, file) => result + file.size, 0),
      uploadTraces: []
    })

    try {
      await this.traverseFileTree(fileTree, parent);
      this.setState({
        currUploading: false,
        files: []
      });
      showSuccessToast(intl.formatMessage(messages.success));
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (e) {
      console.trace(e);
      this.setState({
        currUploading: false
      });
      showErrorToast(intl.formatMessage(messages.error));
    }

  }

  async traverseFileTree(tree, parent) {
    const filePromises = Object.entries(tree)
      .map(([key, value]) => {
        // base case
        if (value instanceof File) {
          return this.uploadFile(value, parent);
        }
        // recursive case
        return this.uploadFolder(key, parent)
          .then(({ id }) => {
            if (id) { // id is not existent when folder upload failed
              return this.traverseFileTree(value, { id, foreign_id: key });
            }
          });
      });

    await Promise.all(filePromises);
  }

  updateUploadTraces() {
    this.setState(({ uploadTraces }) => ({
      uploadTraces: [...uploadTraces]
    }));
  }

  addUploadTrace(uploadTrace) {
    this.setState(({ uploadTraces }) => {
      const _uploadTraces = [...uploadTraces];
      _uploadTraces.push(uploadTrace);
      return {
        uploadTraces: _uploadTraces
      }
    });
  }

  onFileProgress(uploadTrace, progressEvent) {
    if (progressEvent.lengthComputable) {
      uploadTrace.uploaded = progressEvent.loaded;
      uploadTrace.total = progressEvent.total;
      this.updateUploadTraces();
    }
  }

  doTracedIngest(metadata, file, uploadTrace) {
    const { collection, ingestDocument } = this.props;

    this.addUploadTrace(uploadTrace);
    return ingestDocument(collection.id, metadata, file, (ev) => this.onFileProgress(uploadTrace, ev))
      .then((result) => {
        uploadTrace.status = 'done';
        this.updateUploadTraces();
        return result;
      })
      .catch((e) => {
        console.error(`failure uploading ${uploadTrace.name}`, e);
        uploadTrace.status = 'error';
        this.updateUploadTraces();
        throw e;
      });
  }

  uploadFile(file, parent) {
    const uploadTrace = {
      name: file.name,
      size: file.size,
      uploaded: 0,
      total: file.size,
      status: 'pending'
    };

    const metadata = {
      file_name: file.name,
      mime_type: file.type,
    };
    if (parent?.id) {
      metadata.parent_id = parent.id;
    }

    return this.doTracedIngest(metadata, file, uploadTrace);
  }

  uploadFolder(title, parent) {
    const uploadTrace = {
      name: title,
      status: 'pending'
    };

    const metadata = {
      file_name: title,
      foreign_id: title,
    };
    if (parent?.id) {
      metadata.foreign_id = `${parent.id}/${title}`;
      metadata.parent_id = parent.id;
    }

    return this.doTracedIngest(metadata, null, uploadTrace);
  }


  renderContent() {
    const { files, currUploading, uploadTraces, totalUploadSize } = this.state;

    if (currUploading) {
      return (
        <DocumentUploadStatus uploadTraces={uploadTraces} totalUploadSize={totalUploadSize}/>
      );
    }
    if (files && files.length) {
      return <DocumentUploadView files={files} onSubmit={this.onFormSubmit}/>;
    }

    return <DocumentUploadForm onFilesChange={this.onFilesChange}/>;
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
  connect(null, mapDispatchToProps),
  injectIntl,
)(DocumentUploadDialog);
