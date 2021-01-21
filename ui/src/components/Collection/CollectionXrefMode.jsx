import React from 'react';
import { injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import SearchFacets from 'components/Facet/SearchFacets';
import { QueryInfiniteLoad } from 'components/common';
import CollectionXrefManageMenu from 'components/Collection/CollectionXrefManageMenu';
import XrefTable from 'components/XrefTable/XrefTable';
import { collectionXrefFacetsQuery } from 'queries';
import { selectCollection, selectCollectionXrefResult } from 'selectors';
import { queryCollectionXref, queryRoles } from 'actions';

import './CollectionXrefMode.scss';

export class CollectionXrefMode extends React.Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
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
            <QueryInfiniteLoad
              query={query}
              result={result}
              fetch={this.props.queryCollectionXref}
            />
          </div>
        </div>
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;
  const query = collectionXrefFacetsQuery(location, collectionId);
  return {
    collection: selectCollection(state, collectionId),
    query,
    result: selectCollectionXrefResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollectionXref, queryRoles }),
  injectIntl,
)(CollectionXrefMode);
