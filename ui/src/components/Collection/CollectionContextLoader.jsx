import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import { fetchCollection, fetchCollectionStatus, fetchCollectionXrefIndex, queryDiagrams, mutate } from 'src/actions';
import { selectCollection, selectCollectionStatus, selectCollectionXrefIndex, selectDiagramsResult } from 'src/selectors';


class CollectionContextLoader extends PureComponent {
  constructor(props) {
    super(props);
    this.fetchStatus = this.fetchStatus.bind(this);
  }

  componentDidMount() {
    this.fetchStatus();
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    const { status } = this.props;
    const prevStatus = prevProps.status;
    this.fetchIfNeeded();

    const wasUpdating = prevStatus.pending > 0 || prevStatus.running > 0;
    const isUpdating = status.pending > 0 || status.running > 0;

    if (wasUpdating && !isUpdating) {
      this.props.mutate();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  fetchIfNeeded() {
    const { collectionId, collection, status, diagramsQuery, diagramsResult } = this.props;

    if (collection.shouldLoad) {
      this.props.fetchCollection({ id: collectionId });
    }

    if (status.shouldLoad) {
      this.fetchStatus();
    }

    const { xrefIndex } = this.props;
    if (xrefIndex.shouldLoad) {
      this.props.fetchCollectionXrefIndex({ id: collectionId });
    }

    if (diagramsResult.shouldLoad) {
      this.props.queryDiagrams({ query: diagramsQuery });
    }
  }

  fetchStatus() {
    const { collectionId } = this.props;
    clearTimeout(this.timeout);
    this.props.fetchCollectionStatus({ id: collectionId })
      .finally(() => {
        const { status } = this.props;
        const duration = status.pending === 0 ? 6000 : 2000;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(this.fetchStatus, duration);
      });
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps;

  const context = {
    'filter:collection_id': collectionId,
  };
  const diagramsQuery = new Query('diagrams', {}, context, 'diagrams')
    .sortBy('updated_at', 'desc');

  return {
    collection: selectCollection(state, collectionId),
    status: selectCollectionStatus(state, collectionId),
    xrefIndex: selectCollectionXrefIndex(state, collectionId),
    diagramsQuery,
    diagramsResult: selectDiagramsResult(state, diagramsQuery),
  };
};
const mapDispatchToProps = {
  mutate,
  fetchCollection,
  fetchCollectionStatus,
  fetchCollectionXrefIndex,
  queryDiagrams,
};
export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(CollectionContextLoader);
