import React, { Component } from 'react';
import { connect } from "react-redux";
import { ProgressBar } from '@blueprintjs/core';

import CaseScreen from 'src/screens/CaseScreen/CaseScreen';
import FolderViewer from "../DocumentViewer/FolderViewer";
import { fetchCollection, uploadDocument } from "src/actions";
import { selectCollection } from "src/selectors";

import './CaseDocumentsContent.css';

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

  onFormSubmit(e) {
    e.preventDefault();
    this.fileUpload(this.state.file);
  }

  onChange(e) {
    this.setState({file: e.target.files[ 0 ]})
  }

  onUploadProgress(progressEvent) {
    let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    console.log(percentCompleted)
    this.setState({percentCompleted: percentCompleted});
  }

  fileUpload(file) {
    return this.props.uploadDocument(this.props.collectionId, file, this.onUploadProgress);
  }

  render() {
    const {collection} = this.props;
    const {percentCompleted} = this.state;

    return (
      <CaseScreen className='CaseDocuments' activeTab='Documents'>
        <ProgressBar value={percentCompleted} animate={false} stripes={false} className='pt-intent-success'/>
        <form className='case-upload' onSubmit={this.onFormSubmit}>
          <input type="file" onChange={this.onChange}/>
          <button type="submit">Upload</button>
        </form>
        <FolderViewer className='case-folder-viewer' document={collection}/>
      </CaseScreen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {collectionId} = ownProps.match.params;
  return {
    collectionId,
    collection: selectCollection(state, collectionId)
  };
};

CaseDocumentsContent = connect(mapStateToProps, {fetchCollection, uploadDocument})(CaseDocumentsContent);
export default CaseDocumentsContent;
