// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import axios from 'axios';
import {
  Classes, Dialog,
} from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { ingestDocument as ingestDocumentAction, forceMutate } from 'actions';
import convertPathsToTree from 'util/convertPathsToTree';
import DocumentUploadForm from './DocumentUploadForm';
import DocumentUploadStatus, { UPLOAD_STATUS } from './DocumentUploadStatus';
import DocumentUploadView from './DocumentUploadView';
import { Entity } from 'components/common';

import './DocumentUploadDialog.scss';


const messages = defineMessages({
  title: {
    id: 'document.upload.title',
    defaultMessage: 'Upload documents',
  },
  title_in_folder: {
    id: 'document.upload.title_in_folder',
    defaultMessage: 'Upload documents to {folder}',
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
    this.onRetry = this.onRetry.bind(this);
    this.uploadConcurrencyLimit = 10;
    this.uploadPromises = [];
  }

  onFilesChange(files) {
    this.setState({ files });
  }

  async onFormSubmit(files) {
    const {
      parent,
    } = this.props;

    const fileTree = convertPathsToTree(files);
    await this.setState({
      uploadMeta: {
        totalUploadSize: files.reduce((result, file) => result + file.size, 0),
        totalFiles: files.length,
        status: UPLOAD_STATUS.PENDING,
        cancelSource: axios.CancelToken.source()
      },
      uploadTraces: []
    })

    this.uploadPromises.length = 0;
    await this.traverseFileTree(fileTree, parent);
    this.onUploadDone();
  }

  onClose() {
    const { toggleDialog, isOpen, onUploadSuccess } = this.props;
    const { uploadMeta } = this.state;

    if (uploadMeta?.status === UPLOAD_STATUS.PENDING) {
      this.onCancel();
    }

    if (uploadMeta && uploadMeta.status !== UPLOAD_STATUS.PENDING) {
      onUploadSuccess && onUploadSuccess();
    }
    if (isOpen) {
      toggleDialog();
    }

    this.setState({
      files: [],
      uploadTraces: [],
      uploadMeta: null
    });
  }

  async onRetry() {
    const { uploadTraces, uploadMeta } = this.state;
    const errorTraces = uploadTraces.filter(trace => trace.status === UPLOAD_STATUS.ERROR);
    await this.setState({
      uploadMeta: Object.assign({}, uploadMeta, {
        status: UPLOAD_STATUS.PENDING
      }),
      uploadTraces: uploadTraces.filter(trace => trace.status !== UPLOAD_STATUS.ERROR)
    });
    this.uploadPromises.length = 0;
    return Promise.all(errorTraces.map(trace => trace.retryFn()))
      .then(() => this.onUploadDone());
  }

  onCancel() {
    const { uploadMeta } = this.state;
    uploadMeta.cancelSource.cancel();
  }

  onUploadDone() {
    this.setState(({ uploadMeta, uploadTraces }) => {
      if (uploadMeta) { // on cancellation uploadMeta could be none, as it takes a while to cancel all requests
        return {
          uploadMeta: Object.assign({}, uploadMeta, {
            status: uploadTraces.filter(trace => trace.status === UPLOAD_STATUS.SUCCESS).length > 0 ? UPLOAD_STATUS.SUCCESS : UPLOAD_STATUS.ERROR
          })
        }
      }
    });
    this.props.forceMutate();
  }

  async traverseFileTree(tree, parent) {
    const filePromises = Object.entries(tree)
      .map(([key, value]) => {
        // base case
        if (value instanceof File) {
          return this.uploadFile(value, parent);
      }
        // recursive case
        return this.uploadFolderRecursive(key, parent, value);
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

  doTracedIngest(metadata, file, uploadTrace, retryFn) {
    const { collection, ingestDocument } = this.props;
    const { uploadMeta } = this.state;

    this.addUploadTrace(uploadTrace);

    const execute = async () => {
      while (this.uploadPromises.length >= this.uploadConcurrencyLimit) {
        await Promise.race(this.uploadPromises); // wait until the next promise is done
      }

      const promise = ingestDocument(collection.id, metadata, file, (ev) => this.onFileProgress(uploadTrace, ev), uploadMeta.cancelSource.token)
        .then((result) => {
          uploadTrace.status = UPLOAD_STATUS.SUCCESS;
          this.updateUploadTraces();
          return result;
        })
        .catch((e) => {
          console.error(`failure uploading ${uploadTrace.name}`, e);
          uploadTrace.status = UPLOAD_STATUS.ERROR;
          uploadTrace.retryFn = retryFn;
          this.updateUploadTraces();
        });
      this.uploadPromises.push(promise);
      promise.then(() => {
        this.uploadPromises.splice(this.uploadPromises.indexOf(promise), 1)
      })
      return promise;
    }

    return execute();
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

    const retryFn = () => this.uploadFile(file, parent);
    return this.doTracedIngest(metadata, file, uploadTrace, retryFn);
  }

  uploadFolder(title, parent, retryFn) {
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

    return this.doTracedIngest(metadata, null, uploadTrace, retryFn);
  }

  uploadFolderRecursive(title, parent, childTree) {
    const retryFn = () => this.uploadFolderRecursive(title, parent, childTree);
    return this.uploadFolder(title, parent, retryFn)
      .then(result => {
        if (result?.id) { // id is not existent when folder upload failed
          return this.traverseFileTree(childTree, { id: result.id, foreign_id: title });
        }
      });
  }

  renderContent() {
    const { files, uploadTraces, uploadMeta } = this.state;

    if (uploadMeta) {
      return (
        <DocumentUploadStatus uploadTraces={uploadTraces} uploadMeta={uploadMeta} onClose={this.onClose}
                              onRetry={this.onRetry}/>
      );
    }
    if (files && files.length) {
      return <DocumentUploadView files={files} onSubmit={this.onFormSubmit}/>;
    }

    return <DocumentUploadForm onFilesChange={this.onFilesChange}/>;
  }

  render() {
    const { intl, isOpen, parent } = this.props;
    const { uploadMeta } = this.state;
    const closeable = uploadMeta?.status !== UPLOAD_STATUS.PENDING;

    return (
      <Dialog
        icon="upload"
        className="DocumentUploadDialog"
        isOpen={isOpen}
        canEscapeKeyClose={closeable}
        canOutsideClickClose={closeable}
        isCloseButtonShown={closeable}
        title={parent ? intl.formatMessage(messages.title_in_folder, { folder: <Entity.Label entity={parent} /> }) : intl.formatMessage(messages.title)}
        onClose={this.onClose}
      >
        <div className={Classes.DIALOG_BODY}>
          {this.renderContent()}
        </div>
      </Dialog>
    );
  }
}

const mapDispatchToProps = { ingestDocument: ingestDocumentAction, forceMutate };

export default compose(
  connect(null, mapDispatchToProps),
  injectIntl,
)(DocumentUploadDialog);
