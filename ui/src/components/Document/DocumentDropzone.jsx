{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import DocumentUploadDialog from 'dialogs/DocumentUploadDialog/DocumentUploadDialog';
import c from 'classnames';

import './DocumentDropzone.scss';

class DocumentDropzone extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadIsOpen: false,
    };

    this.openDialog = this.openDialog.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
  }

  openDialog(files = []) {
    this.setState({ uploadIsOpen: true, filesToUpload: files });
  }

  closeDialog() {
    this.setState({ uploadIsOpen: false, filesToUpload: null });
  }

  render() {
    const { canDrop, children, collection, parent } = this.props;

    if (!canDrop) {
      return children;
    }

    return (
      <>
        <Dropzone
          onDrop={acceptedFiles => (
            acceptedFiles && acceptedFiles.length ? this.openDialog(acceptedFiles) : null
          )}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div {...getRootProps()} className={'DocumentDropzone'}>
              <input
                {...getInputProps()}
                onClick={e => { e.preventDefault(); e.stopPropagation(); }}
              />
              <div className={c('DocumentDropzone__content', { active: isDragActive })}>
                {children}
              </div>
            </div>
          )}
        </Dropzone>
        {this.state.uploadIsOpen && (
          <DocumentUploadDialog
            collection={collection}
            isOpen={this.state.uploadIsOpen}
            toggleDialog={this.closeDialog}
            filesToUpload={this.state.filesToUpload}
            onUploadSuccess={this.props.onUploadSuccess}
            parent={parent}
          />
        )}
      </>
    );
  }
}

export default DocumentDropzone;
