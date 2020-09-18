import React, { Component } from 'react';
import {
  Classes, Dialog,
} from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { ingestDocument as ingestDocumentAction } from 'actions';
import convertPathsToTree from 'util/convertPathsToTree';
import DocumentUploadForm from './DocumentUploadForm';
import DocumentUploadStatus, { UPLOAD_STATUS } from './DocumentUploadStatus';
import DocumentUploadView from './DocumentUploadView';

import './DocumentUploadDialog.scss';


const messages = defineMessages({
  title: {
    id: 'document.upload.title',
    defaultMessage: 'Upload Documents',
  }
});

export class DocumentUploadDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: props.filesToUpload || [],
      uploadMeta: null,
      uploadTraces: []
    };
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onFilesChange = this.onFilesChange.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  onFilesChange(files) {
    this.setState({ files });
  }

  async onFormSubmit(files) {
    const {
      parent,
    } = this.props;

    const fileTree = convertPathsToTree(files);
    this.setState({
      uploadMeta: {
        totalUploadSize: files.reduce((result, file) => result + file.size, 0),
        totalFiles: files.length,
        status: UPLOAD_STATUS.PENDING
      },
      uploadTraces: []
    })

    await this.traverseFileTree(fileTree, parent);

    this.setState(({ uploadMeta, uploadTraces }) => ({
      uploadMeta: Object.assign({}, uploadMeta, {
        status: uploadTraces.filter(trace => trace.status === UPLOAD_STATUS.SUCCESS).length > 0 ? UPLOAD_STATUS.SUCCESS : UPLOAD_STATUS.ERROR
      })
    }));
  }

  onClose() {
    const { toggleDialog, isOpen, onUploadSuccess } = this.props;
    const { uploadDone } = this.state;

    this.setState({
      files: [],
      uploadTraces: [],
      uploadMeta: null
    });

    if (uploadDone) {
      onUploadSuccess();
    }
    else if (isOpen) {
      toggleDialog();
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
          .then(result => {
            if (result?.id) { // id is not existent when folder upload failed
              return this.traverseFileTree(value, { id: result.id, foreign_id: key });
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
        uploadTrace.status = UPLOAD_STATUS.SUCCESS;
        this.updateUploadTraces();
        return result;
      })
      .catch((e) => {
        console.error(`failure uploading ${uploadTrace.name}`, e);
        uploadTrace.status = UPLOAD_STATUS.ERROR;
        this.updateUploadTraces();
      });
  }

  uploadFile(file, parent) {
    const uploadTrace = {
      name: file.name,
      size: file.size,
      type: 'file',
      uploaded: 0,
      total: file.size,
      status: UPLOAD_STATUS.PENDING
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
      type: 'directory',
      status: UPLOAD_STATUS.PENDING
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
    const { files, uploadTraces, uploadMeta } = this.state;

    if (uploadMeta) {
      return (
        <DocumentUploadStatus uploadTraces={uploadTraces} uploadMeta={uploadMeta} onClose={this.onClose} />
      );
    }
    if (files && files.length) {
      return <DocumentUploadView files={files} onSubmit={this.onFormSubmit}/>;
    }

    return <DocumentUploadForm onFilesChange={this.onFilesChange}/>;
  }

  render() {
    const { intl, isOpen } = this.props;

    return (
      <Dialog
        icon="upload"
        className="DocumentUploadDialog"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={this.onClose}
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
