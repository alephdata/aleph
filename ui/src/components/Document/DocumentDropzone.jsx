import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import DocumentUploadDialog from 'src/dialogs/DocumentUploadDialog/DocumentUploadDialog';
import c from 'classnames';

import './DocumentDropzone.scss';

class DocumentDropzone extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadIsOpen: false,
    };

    this.toggleUpload = this.toggleUpload.bind(this);
  }

  toggleUpload(files = []) {
    this.setState(({ uploadIsOpen }) => ({
      uploadIsOpen: !uploadIsOpen,
      filesToUpload: files,
    }));
  }

  render() {
    const { canDrop, children, collection, document, onUploadSuccess } = this.props;

    if (!canDrop) {
      return children;
    }

    return (
      <>
        <Dropzone
          onDrop={acceptedFiles => (
            acceptedFiles && acceptedFiles.length ? this.toggleUpload(acceptedFiles) : null
          )}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div {...getRootProps()}>
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
            toggleDialog={this.toggleUpload}
            filesToUpload={this.state.filesToUpload}
            onUploadSuccess={onUploadSuccess}
            parent={document}
          />
        )}
      </>
    );
  }
}

export default DocumentDropzone;
