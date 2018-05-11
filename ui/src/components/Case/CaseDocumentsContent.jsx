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
      <CaseScreen collection={collection} result={this.props.result}>
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
  const {location} = ownProps;
  const context = {
    facet: [ 'category', 'countries' ],
    'filter:kind': 'casefile'
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .sortBy('count', true)
    .limit(30);

  return {
    query: query,
    result: selectCollectionsResult(state, query)
  };
};

CaseDocumentsContent = connect(mapStateToProps, {queryCollections})(CaseDocumentsContent);
export default ({ match, ...otherProps }) => (
  <Collection.Load
    id={match.params.collectionId}
    renderWhenLoading={<ScreenLoading />}
  >{collection => (
    <CaseDocumentsContent collection={collection} {...otherProps} />
  )}</Collection.Load>
);
