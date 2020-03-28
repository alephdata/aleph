import React from 'react';
import { injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Waypoint } from 'react-waypoint';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import SearchFacets from 'src/components/Facet/SearchFacets';
import CollectionXrefManageMenu from 'src/components/Collection/CollectionXrefManageMenu';
import XrefTable from 'src/components/XrefTable/XrefTable';
import { queryCollectionXrefFacets } from 'src/queries';
import { selectCollectionXrefResult } from 'src/selectors';
import { queryCollectionXref, queryRoles } from 'src/actions';
import { queryGroups } from 'src/queries';
import { selectRolesResult } from 'src/selectors';


import './CollectionXrefMode.scss';

export class CollectionXrefMode extends React.Component {
  constructor(props) {
    super(props);
    this.toggleExpand = this.toggleExpand.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.updateContext = this.updateContext.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result && !result.isPending && result.next && !result.isError) {
      this.props.queryCollectionXref({ query, result, next: result.next });
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  updateContext(contextId) {
    const { history, location, parsedHash } = this.props;
    parsedHash.context = contextId;
    parsedHash.expand = undefined;
    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  fetchIfNeeded() {
    const { collection, query, result } = this.props;
    if (result.shouldLoad && collection.id) {
      this.props.queryCollectionXref({ query });
    }

    const { groupsResult, groupsQuery } = this.props;
    if (groupsResult.shouldLoad) {
      this.props.queryRoles({query: groupsQuery});
    }
  }

  toggleExpand(xref) {
    const { expandedId, parsedHash, history, location } = this.props;
    parsedHash.expand = expandedId === xref.id ? undefined : xref.id;
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { expandedId, contextId, collection, query, result } = this.props;
    return (
      <section className="CollectionXrefMode">
        <div className="pane-layout">
          <div className="pane-layout-side">
            <SearchFacets
              facets={['match_collection_id', 'schema', 'countries']}
              query={query}
              result={result}
              updateQuery={this.updateQuery}
            />
          </div>
          <div className="pane-layout-main">
            <CollectionXrefManageMenu
              collection={collection}
              contextId={contextId}
              updateContext={this.updateContext}
              result={result}
            />
            <XrefTable
              expandedId={expandedId}
              contextId={contextId}
              result={result}
              toggleExpand={this.toggleExpand}
            />
            <Waypoint
              onEnter={this.getMoreResults}
              bottomOffset="-300px"
              scrollableAncestor={window}
            />
          </div>
        </div>
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const parsedHash = queryString.parse(location.hash);
  const contextId = parsedHash.context;
  const groupsQuery = queryGroups(location);
  const query = queryCollectionXrefFacets(location, collection.id, contextId);
  return {
    query,
    parsedHash,
    contextId,
    expandedId: parsedHash.expand,
    groupsQuery,
    groupsResult: selectRolesResult(state, groupsQuery),
    result: selectCollectionXrefResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollectionXref, queryRoles }),
  injectIntl,
)(CollectionXrefMode);
