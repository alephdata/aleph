import React, {Component} from "react";
import {Button, Dialog, Intent, ProgressBar} from "@blueprintjs/core";
import {defineMessages, FormattedMessage, injectIntl} from "react-intl";
import {connect} from "react-redux";
import {withRouter} from "react-router";

import {ingestDocument} from "src/actions";
import {showErrorToast} from "src/app/toast";
import wordList from 'src/util/wordList';

import "./DocumentUploadDialog.scss";

const messages = defineMessages({
  title: {
    id: "document.upload.title",
    defaultMessage: "Upload documents"
  },
  save: {
    id: 'document.upload.save',
    defaultMessage: 'Upload'  
  },
  choose_file: {
    id: 'document.upload.choose_file',
    defaultMessage: 'Choose files to upload...'  
  },
  success: {
    id: 'document.upload.success',
    defaultMessage: 'Documents are being processed...'
  },
  error: {
    id: 'document.upload.error',
    defaultMessage: 'There was an error while uploading the file.'
  }
});


class DocumentUploadDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [],
      percentCompleted: 0,
      uploadingFile: null
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onFilesChange = this.onFilesChange.bind(this);
    this.onUploadProgress = this.onUploadProgress.bind(this);
  }

  onFilesChange(event) {
    this.setState({files: Array.from(event.target.files)})
  }

  async onFormSubmit(event) {
    event.preventDefault();
    const { intl, collection, parent } = this.props;
    try {
      for (let file of this.state.files) {
        this.setState({percentCompleted: 0, uploadingFile: file});
        const metadata = {
          'file_name': file.name,
          'mime_type': file.type,
          'parent': parent
        };
        await this.props.ingestDocument(collection.id, metadata, file, this.onUploadProgress);
      }
      // showSuccessToast(intl.formatMessage(messages.success));
      this.props.toggleDialog();
      // history.push({
      //   pathname: history.location.pathname,
      //   search: history.location.search,
      //   fragment: history.location.fragment
      // });
    } catch (e) {
      showErrorToast(intl.formatMessage(messages.error));
      console.log(e);
    }
    this.setState({uploadingFile: null});
  }

  onUploadProgress(progressEvent) {
    let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    this.setState({percentCompleted: percentCompleted});
  }

  render() {
    const { intl } = this.props;
    const { percentCompleted, uploadingFile, files } = this.state;
    const fileNames = files.map((file) => file.name);

    return (
      <Dialog icon="upload"
              className="DocumentUploadDialog"
              isOpen={this.props.isOpen}
              title={intl.formatMessage(messages.title)}
              onClose={this.props.toggleDialog}>
        { uploadingFile && (
          <div className="bp3-dialog-body">
            <p>
              <FormattedMessage id='document.upload.progress'
                                defaultMessage="Uploading: {file}..."
                                values={{file: uploadingFile.name}} />
            </p>
            <ProgressBar value={percentCompleted}
                        animate={false}
                        stripes={false}
                        className='bp3-intent-success document-upload-progress-bar'/>
            <p className="text-muted">
              <FormattedMessage id='document.upload.notice'
                                defaultMessage="Once the upload is complete, it will take a few moments for the document to be processed and become searchable." />
            </p>
          </div>
        )}
        { !uploadingFile && (
          <form onSubmit={this.onFormSubmit}>
            <div className="bp3-dialog-body">
              <div className="bp3-form-group">
                <div className="bp3-input-group bp3-large bp3-fill">
                  <label className="bp3-file-input bp3-large bp3-fill">
                    <input type="file" multiple
                          className="bp3-large bp3-fill"
                          onChange={this.onFilesChange} />
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
                <Button type="submit"
                        intent={Intent.PRIMARY}
                        text={intl.formatMessage(messages.save)} />
              </div>
            </div>
          </form>
        )}
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
};

DocumentUploadDialog = injectIntl(DocumentUploadDialog);
DocumentUploadDialog = withRouter(DocumentUploadDialog);
export default connect(mapStateToProps, {ingestDocument})(DocumentUploadDialog);
