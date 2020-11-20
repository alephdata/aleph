import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { queryCollectionEntitySets, queryCollectionXrefFacets, queryCollectionDocuments } from 'queries';
import { fetchCollection, queryCollectionXref, queryEntitySets, queryEntities, mutate } from 'actions';
import { selectCollection, selectCollectionStatus, selectCollectionXrefResult, selectEntitiesResult, selectEntitySetsResult } from 'selectors';


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

    const { listsQuery, listsResult } = this.props;
    if (listsResult.shouldLoad) {
      this.props.queryEntitySets({ query: listsQuery });
    }

    const { docsQuery, docsResult } = this.props;
    if (docsResult.shouldLoad) {
      this.props.queryEntities({ query: docsQuery });
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
  const listsQuery = entitySetsQuery.setFilter('type', 'list');
  const xrefQuery = queryCollectionXrefFacets(location, collectionId);
  const docsQuery = queryCollectionDocuments(location, collectionId);
  return {
    collection: selectCollection(state, collectionId),
    status: selectCollectionStatus(state, collectionId),
    xrefQuery,
    xrefResult: selectCollectionXrefResult(state, xrefQuery),
    diagramsQuery,
    diagramsResult: selectEntitySetsResult(state, diagramsQuery),
    listsQuery,
    listsResult: selectEntitySetsResult(state, listsQuery),
    docsQuery,
    docsResult: selectEntitiesResult(state, docsQuery),
  };
};

const mapDispatchToProps = {
  mutate,
  fetchCollection,
  queryCollectionXref,
  queryEntitySets,
  queryEntities,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(CollectionContextLoader);
