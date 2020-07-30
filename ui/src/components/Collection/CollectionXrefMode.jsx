import React from 'react';
import { injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Waypoint } from 'react-waypoint';
import { withRouter } from 'react-router';

import SearchFacets from 'components/Facet/SearchFacets';
import CollectionXrefManageMenu from 'components/Collection/CollectionXrefManageMenu';
import XrefTable from 'components/XrefTable/XrefTable';
import { queryCollectionXrefFacets } from 'queries';
import { selectCollectionXrefResult } from 'selectors';
import { queryCollectionXref, queryRoles } from 'actions';

import './CollectionXrefMode.scss';

export class CollectionXrefMode extends React.Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
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
    if (result && !result.isPending && result.next) {
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

  fetchIfNeeded() {
    const { collection, query, result } = this.props;
    if (result.shouldLoad && collection.id) {
      this.props.queryCollectionXref({ query });
    }
  }

  render() {
    const { collection, query, result } = this.props;
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
              result={result}
            />
            <XrefTable result={result} />
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
  const query = queryCollectionXrefFacets(location, collection.id);
  return {
    query,
    result: selectCollectionXrefResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollectionXref, queryRoles }),
  injectIntl,
)(CollectionXrefMode);
