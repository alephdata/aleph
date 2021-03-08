import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button, Intent } from '@blueprintjs/core';
import queryString from 'query-string';

import SearchActionBar from 'components/common/SearchActionBar';
import SearchFacets from 'components/Facet/SearchFacets';
import { QueryInfiniteLoad } from 'components/common';
import CollectionXrefManageMenu from 'components/Collection/CollectionXrefManageMenu';
import XrefTable from 'components/XrefTable/XrefTable';
import { collectionXrefFacetsQuery } from 'queries';
import { selectCollection, selectCollectionXrefResult, selectTester } from 'selectors';
import { queryCollectionXref, queryRoles } from 'actions';

import './CollectionXrefMode.scss';
import 'src/components/common/SortingBar.scss';

const messages = defineMessages({
  sort_random: {
    id: 'xref.sort.random',
    defaultMessage: 'Random',
  },
  sort_default: {
    id: 'xref.sort.default',
    defaultMessage: 'Default',
  }
});

export class CollectionXrefMode extends React.Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
    this.toggleEvalMode = this.toggleEvalMode.bind(this);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.selectedIndex = undefined;

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  toggleEvalMode() {
    const { isEvalMode, query } = this.props;
    const newQuery = query.set('evaluation_mode', !isEvalMode);
    this.updateQuery(newQuery)
  }

  render() {
    const { collection, isEvalMode, intl, isTester, query, result } = this.props;
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
            <div className="CollectionXrefMode__actions">
              <CollectionXrefManageMenu
                collection={collection}
                result={result}
                query={query}
              />
              <SearchActionBar result={result}>
                {isTester && (
                  <div className="SortingBar">
                    <span className="SortingBar__label">
                      <FormattedMessage
                        id="xref.sort.label"
                        defaultMessage="Sort by:"
                      />
                    </span>
                    <div className="SortingBar__control">
                      <Button
                        text={intl.formatMessage(messages[isEvalMode ? 'sort_random' : 'sort_default'])}
                        onClick={this.toggleEvalMode}
                        minimal
                        intent={Intent.PRIMARY}
                      />
                    </div>
                  </div>
                )}
              </SearchActionBar>
            </div>
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
    isTester: selectTester(state),
    isEvalMode: query.getBool('evaluation_mode'),
    result: selectCollectionXrefResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollectionXref, queryRoles }),
  injectIntl,
)(CollectionXrefMode);
