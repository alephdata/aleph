import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";

import { fetchCollection, fetchCollectionXrefIndex } from 'src/actions';
import { selectCollection, selectCollectionXrefIndex } from "src/selectors";


class CollectionContextLoader extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collectionId, collection } = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({id: collectionId});
    }

    const { xrefIndex } = this.props;
    if (xrefIndex.shouldLoad) {
      this.props.fetchCollectionXrefIndex({id: collectionId});
    }
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps;
  return {
    collection: selectCollection(state, collectionId),
    xrefIndex: selectCollectionXrefIndex(state, collectionId)
  };
};

CollectionContextLoader = withRouter(CollectionContextLoader);
CollectionContextLoader = connect(mapStateToProps, { fetchCollection, fetchCollectionXrefIndex })(CollectionContextLoader);
export default (CollectionContextLoader);
