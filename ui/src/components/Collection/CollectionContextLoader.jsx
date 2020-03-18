import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
  fetchCollection,
  fetchCollectionStatus,
  fetchCollectionProcessingReport,
  queryCollectionXref,
  queryDiagrams,
  mutate,
} from 'src/actions';
import {
  selectCollection,
  selectCollectionStatus,
  selectDiagramsResult,
  selectCollectionXrefResult,
  selectCollectionProcessingReport,
} from 'src/selectors';
import { queryCollectionDiagrams, queryCollectionXrefFacets } from 'src/queries';

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
    const { processingReport, collectionId, collection, status } = this.props;

    if (collection.shouldLoad) {
      this.props.fetchCollection({ id: collectionId });
    }

    if (status.shouldLoad) {
      this.fetchStatus();
    }

    const { xrefResult, xrefQuery } = this.props;
    if (xrefResult.shouldLoad) {
      this.props.queryCollectionXref({ query: xrefQuery });
    }

    const { diagramsQuery, diagramsResult } = this.props;
    if (diagramsResult.shouldLoad) {
      this.props.queryDiagrams({ query: diagramsQuery });
    }

    if (processingReport.shouldLoad) {
      this.props.fetchCollectionProcessingReport({ id: collectionId });
    }
  }

  fetchStatus() {
    const { collectionId } = this.props;
    clearTimeout(this.timeout);
    this.props.fetchCollectionStatus({ id: collectionId }).finally(() => {
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
  const { collectionId, location } = ownProps;
  const diagramsQuery = queryCollectionDiagrams(location, collectionId);
  const xrefQuery = queryCollectionXrefFacets(location, collectionId);
  return {
    collection: selectCollection(state, collectionId),
    status: selectCollectionStatus(state, collectionId),
    xrefQuery,
    xrefResult: selectCollectionXrefResult(state, xrefQuery),
    diagramsQuery,
    diagramsResult: selectDiagramsResult(state, diagramsQuery),
    processingReport: selectCollectionProcessingReport(state, collectionId),
  };
};

const mapDispatchToProps = {
  mutate,
  fetchCollection,
  fetchCollectionStatus,
  queryCollectionXref,
  queryDiagrams,
  fetchCollectionProcessingReport,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(CollectionContextLoader);
