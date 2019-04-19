import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { fetchCollection, fetchCollectionXrefIndex } from 'src/actions';
import { selectCollection, selectCollectionXrefIndex } from 'src/selectors';


class CollectionContextLoader extends PureComponent {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collectionId, collection } = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({ id: collectionId });
    }

    const { xrefIndex } = this.props;
    if (xrefIndex.shouldLoad) {
      this.props.fetchCollectionXrefIndex({ id: collectionId });
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
    xrefIndex: selectCollectionXrefIndex(state, collectionId),
  };
};
const mapDispatchToProps = { fetchCollection, fetchCollectionXrefIndex };
export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(CollectionContextLoader);
