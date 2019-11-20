import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { fetchCollection, fetchCollectionStatus, fetchCollectionXrefIndex } from 'src/actions';
import { selectCollection, selectCollectionStatus, selectCollectionXrefIndex } from 'src/selectors';


class CollectionContextLoader extends PureComponent {
  constructor(props) {
    super(props);
    this.fetchStatus = this.fetchStatus.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
    this.fetchStatus();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
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

  fetchStatus() {
    const { collection } = this.props;
    console.log('setting up status fetcher');
    this.props.fetchCollectionStatus(collection)
      .finally(() => {
        const { status } = this.props;
        const duration = status.pending === 0 ? 6000 : 2000;
        this.timeout = setTimeout(this.fetchStatus, duration);
      });
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps;
  return {
    collection: selectCollection(state, collectionId),
    status: selectCollectionStatus(state, collectionId),
    xrefIndex: selectCollectionXrefIndex(state, collectionId),
  };
};
const mapDispatchToProps = { fetchCollection, fetchCollectionStatus, fetchCollectionXrefIndex };
export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(CollectionContextLoader);
