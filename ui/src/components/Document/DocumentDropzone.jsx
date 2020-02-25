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
    console.log('toggling upload', files);
    this.setState(({ uploadIsOpen }) => ({
      uploadIsOpen: !uploadIsOpen,
      filesToUpload: files,
    }));
  }

  render() {
    const { canDrop, children, collection } = this.props;

    if (!canDrop) {
      return children;
    }

    console.log('RENDERINFF');

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
              <div className={c('DocumentDropzone__contents', { active: isDragActive })}>
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
          />
        )}
      </>
    );
  }
}

export default DocumentDropzone;
