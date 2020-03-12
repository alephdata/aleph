import React from 'react';
import { ButtonGroup, AnchorButton, Button } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Waypoint } from 'react-waypoint';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedNumber, FormattedMessage } from 'react-intl';

import { SectionLoading, ErrorSection, DualPane, Entity, Date, Country, Collection } from 'src/components/common';
import CollectionXrefDialog from 'src/dialogs/CollectionXrefDialog/CollectionXrefDialog';
import SearchFacets from 'src/components/Facet/SearchFacets';
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
    this.toggleXref = this.toggleXref.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.renderTable = this.renderTable.bind(this);
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

  static renderRow(xref) {
    if (!xref.entity || !xref.match) {
      return null;
    }
    return (
      <tr key={xref.id}>
        <td className="numeric narrow">
          <FormattedNumber value={parseInt(parseFloat(xref.score) * 100, 10)} />
        </td>
        <td className="entity">
          <Entity.Link entity={xref.entity} preview icon />
          {/* {'('}
          <Date.Earliest values={xref.entity.getTypeValues('date')} />
          <Country.List codes={xref.entity.getTypeValues('country')} short />
          {')'} */}
        </td>
        <td className="entity">
          <Entity.Link entity={xref.match} preview icon />
          {/* {'('}
          <Date.Earliest values={xref.match.getTypeValues('date')} />
          <Country.List codes={xref.match.getTypeValues('country')} short />
          {')'} */}
        </td>
        <td className="collection">
          <Collection.Link preview collection={xref.match_collection} icon />
        </td>
      </tr>
    );
  }

  toggleXref() {
    this.setState(({ xrefIsOpen }) => ({ xrefIsOpen: !xrefIsOpen }));
  }

  renderTable() {
    const { result } = this.props;
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th className="numeric narrow">
              <span className="value">
                <FormattedMessage
                  id="xref.score"
                  defaultMessage="Score"
                />
              </span>
            </th>
            <th className="entity">
              <span className="value">
                <FormattedMessage
                  id="xref.entity"
                  defaultMessage="Reference"
                />
              </span>
            </th>
            <th className="entity">
              <span className="value">
                <FormattedMessage
                  id="xref.match"
                  defaultMessage="Match"
                />
              </span>
            </th>
            <th className="entity">
              <span className="value">
                <FormattedMessage
                  id="xref.match_collection"
                  defaultMessage="Dataset"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {result.results.map(xref => CollectionXrefMode.renderRow(xref))}
        </tbody>
      </table>
    );
  }

  render() {
    const { session, collection, query, result, intl } = this.props;
    return (
      <section className="CollectionXrefMode">
        <DualPane>
          <DualPane.SidePane>
            <SearchFacets
              facets={['match_collection_id', 'schema', 'countries']}
              query={query}
              result={result}
              updateQuery={this.updateQuery}
            />
          </DualPane.SidePane>
          <DualPane.ContentPane>
            { session.loggedIn && (
              <ButtonGroup>
                <Button icon="play" disabled={!collection.writeable} onClick={this.toggleXref}>
                  <FormattedMessage
                    id="xref.compute"
                    defaultMessage="Compute"
                  />
                </Button>
                <AnchorButton icon="download" href={collection.links.xref_export} download disabled={!result.total}>
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
            {this.renderTable()}
            {result.isLoading && (
              <SectionLoading />
            )}
            <Waypoint
              onEnter={this.getMoreResults}
              bottomOffset="-300px"
              scrollableAncestor={window}
            />
          </DualPane.ContentPane>
        </DualPane>
        <CollectionXrefDialog
          collection={collection}
          isOpen={this.state.xrefIsOpen}
          toggleDialog={this.toggleXref}
        />
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
    session: selectSession(state),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollectionXref }),
  injectIntl,
)(CollectionXrefMode);
