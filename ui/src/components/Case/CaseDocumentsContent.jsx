import React, { Component } from 'react';
import { connect } from "react-redux";
import { ProgressBar, Button, FileInput } from '@blueprintjs/core';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import CaseScreen from 'src/screens/CaseScreen/CaseScreen';
import { fetchCollection, uploadDocument } from "src/actions";
import { selectCollection } from "src/selectors";
import EntitySearch from "src/components/EntitySearch/EntitySearch";

import './CaseDocumentsContent.css';
import { showSuccessToast, showErrorToast } from "src/app/toast";

const messages = defineMessages({
  save_success: {
    id: 'case_upload_success',
    defaultMessage: 'You have successfully uploaded file!'
  },
  save_error: {
    id: 'case_upload_error',
    defaultMessage: 'You did not upload your file!'
  }
});

class CaseDocumentsContent extends Component {

  constructor() {
    super();

    this.state = {
      file: null,
      percentCompleted: 0
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.fileUpload = this.fileUpload.bind(this);
    this.onUploadProgress = this.onUploadProgress.bind(this);
  }

  async componentDidMount() {
    const {collectionId} = this.props;
    this.props.fetchCollection({id: collectionId});
    this.setState({result: this.props.result})
  }

  componentDidUpdate(prevProps) {
    const {collectionId} = this.props;
    if (collectionId !== prevProps.collectionId) {
      this.props.fetchCollection({id: collectionId});
    }
  }

  async onFormSubmit(e) {
    e.preventDefault();
    await this.fileUpload(this.state.file);
  }

  onChange(e) {
    this.setState({file: e.target.files[ 0 ]})
  }

  onUploadProgress(progressEvent) {
    let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    this.setState({percentCompleted: percentCompleted});
  }

  async fileUpload(file) {
    const {intl} = this.props;
    try {
      await this.props.uploadDocument(this.props.collectionId, file, this.onUploadProgress);
      showSuccessToast(intl.formatMessage(messages.save_success));
    } catch (e) {
      showErrorToast(intl.formatMessage(messages.save_error));
      console.log(e)
    }
  }

  render() {
    const {context} = this.props;
    const {percentCompleted, file} = this.state;

    return (
      <CaseScreen className='CaseDocuments' activeTab='Documents'>
        <ProgressBar value={percentCompleted} animate={false} stripes={false} className='pt-intent-success case-upload-progress-bar'/>
        <form className='case-upload' onSubmit={this.onFormSubmit}>
          <div className='case-file-input'>
            <FileInput text="Choose file..." onInputChange={this.onChange} />
            <p className='uploaded-file'>{file === null ? '': file.name}</p>
          </div>
          <Button className="pt-intent-primary pt-button case-upload-button" type="submit"><FormattedMessage id="case.upload" defaultMessage="Upload"/></Button>
        </form>
        <EntitySearch className='case-viewer' context={context} hideCollection={true} />
      </CaseScreen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {collectionId} = ownProps.match.params;

  const context = {
    'filter:collection_id': collectionId
  };

  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    context
  };
};

CaseDocumentsContent = injectIntl(CaseDocumentsContent);
CaseDocumentsContent = connect(mapStateToProps, {fetchCollection, uploadDocument})(CaseDocumentsContent);
export default CaseDocumentsContent;
