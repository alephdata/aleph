import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { queryCollectionEntitySets, queryCollectionXrefFacets } from 'src/queries';
import { fetchCollection, queryCollectionXref, queryEntitySets, mutate } from 'src/actions';
import { selectCollection, selectCollectionStatus, selectCollectionXrefResult, selectEntitySetsResult } from 'src/selectors';


class CollectionContextLoader extends PureComponent {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
    const { status } = this.props;
    const prevStatus = prevProps.status;
    const wasUpdating = prevStatus.pending > 0 || prevStatus.running > 0;
    const isUpdating = status.pending > 0 || status.running > 0;

    if (wasUpdating && !isUpdating) {
      this.props.mutate();
    }
  }

  fetchIfNeeded() {
    const { collectionId, collection } = this.props;

    const loadDeep = (collection.shallow && !collection.isPending);
    if (collection.shouldLoad || loadDeep) {
      const refresh = collection.shallow === false;
      this.props.fetchCollection({ id: collectionId, refresh });
    }

    const { xrefResult, xrefQuery } = this.props;
    if (xrefResult.shouldLoad) {
      this.props.queryCollectionXref({ query: xrefQuery });
    }

    const { diagramsQuery, diagramsResult } = this.props;
    if (diagramsResult.shouldLoad) {
      this.props.queryEntitySets({ query: diagramsQuery });
    }
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;
  const entitySetsQuery = queryCollectionEntitySets(location, collectionId);
  const diagramsQuery = entitySetsQuery.setFilter('type', 'diagram');
  const xrefQuery = queryCollectionXrefFacets(location, collectionId);
  return {
    collection: selectCollection(state, collectionId),
    status: selectCollectionStatus(state, collectionId),
    xrefQuery,
    xrefResult: selectCollectionXrefResult(state, xrefQuery),
    diagramsQuery,
    diagramsResult: selectEntitySetsResult(state, diagramsQuery),
  };
};

const mapDispatchToProps = {
  mutate,
  fetchCollection,
  queryCollectionXref,
  queryEntitySets,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(CollectionContextLoader);
