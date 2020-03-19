import React from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { ButtonGroup, AnchorButton, Button } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Waypoint } from 'react-waypoint';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { SectionLoading, ErrorSection } from 'src/components/common';
import CollectionXrefDialog from 'src/dialogs/CollectionXrefDialog/CollectionXrefDialog';
import SearchFacets from 'src/components/Facet/SearchFacets';
import XrefTable from 'src/components/XrefTable/XrefTable';
import { queryCollectionXrefFacets } from 'src/queries';
import { selectSession, selectCollectionXrefResult } from 'src/selectors';
import { queryCollectionXref } from 'src/actions';

import './CollectionXrefMode.scss';

const messages = defineMessages({
  empty: {
    id: 'collection.xref.empty',
    defaultMessage: 'There are no cross-referencing results.',
  },
});


export class CollectionXrefMode extends React.Component {
  constructor(props) {
    super(props);
    this.state = { xrefIsOpen: false };
    this.toggleXrefDialog = this.toggleXrefDialog.bind(this);
    this.toggleExpand = this.toggleExpand.bind(this);
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
    if (result && !result.isLoading && result.next && !result.isError) {
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
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollectionXref({ query });
    }
  }

  toggleXrefDialog() {
    this.setState(({ xrefIsOpen }) => ({ xrefIsOpen: !xrefIsOpen }));
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
    const { expandedId, session, collection, query, result, intl } = this.props;
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
            { session.loggedIn && (
              <ButtonGroup>
                <Button icon="play" disabled={!collection.writeable} onClick={this.toggleXrefDialog}>
                  <FormattedMessage
                    id="xref.compute"
                    defaultMessage="Compute"
                  />
                </Button>
                <AnchorButton icon="download" href={collection.links?.xref_export} download disabled={!result.total}>
                  <FormattedMessage
                    id="xref.download"
                    defaultMessage="Download Excel"
                  />
                </AnchorButton>
              </ButtonGroup>
            )}
            {result.total === 0 && (
              <ErrorSection
                icon="comparison"
                title={intl.formatMessage(messages.empty)}
              />
            )}
            <XrefTable
              expandedId={expandedId}
              result={result}
              toggleExpand={this.toggleExpand}
            />
            {result.isLoading && (
              <SectionLoading />
            )}
            <Waypoint
              onEnter={this.getMoreResults}
              bottomOffset="-300px"
              scrollableAncestor={window}
            />
          </div>
        </div>
        <CollectionXrefDialog
          collection={collection}
          isOpen={this.state.xrefIsOpen}
          toggleDialog={this.toggleXrefDialog}
        />
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const parsedHash = queryString.parse(location.hash);
  const query = queryCollectionXrefFacets(location, collection.id);

  console.log('in map state to props', collection);
  return {
    query,
    parsedHash,
    expandedId: parsedHash.expand,
    session: selectSession(state),
    result: selectCollectionXrefResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollectionXref }),
  injectIntl,
)(CollectionXrefMode);
