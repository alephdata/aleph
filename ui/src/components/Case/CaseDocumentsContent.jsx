import React, { Component } from 'react';

import CaseScreen from 'src/screens/CaseScreen/CaseScreen';
import { ScreenLoading, Collection } from 'src/components/common';
import { selectCollectionsResult } from "../../selectors";
import Query from "../../app/Query";
import { queryCollections } from "../../actions";
import { connect } from "react-redux";
import FileDrop from 'react-file-drop';

import './CaseDocumentsContent.css';

class CaseDocumentsContent extends Component {

  handleDrop(files, event) {
    console.log('drop', files, event)
  }

  render() {
    const { collection } = this.props;
    console.log(collection)

    return (
      <CaseScreen collection={collection}>
        <div className="react-file-drop-demo">
          <FileDrop onDrop={this.handleDrop}>
            Drop some files here!
          </FileDrop>
        </div>
      </CaseScreen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
  };
};

CaseDocumentsContent = connect(mapStateToProps, {queryCollections})(CaseDocumentsContent);
export default CaseDocumentsContent;
