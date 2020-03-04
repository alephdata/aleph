import React from 'react';
import { Link } from 'react-router-dom';
import { ButtonGroup, AnchorButton, Button } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedNumber, FormattedMessage } from 'react-intl';

import { SectionLoading, ErrorSection, DualPane } from 'src/components/common';
import CollectionXrefDialog from 'src/dialogs/CollectionXrefDialog/CollectionXrefDialog';
import SearchFacets from 'src/components/Facet/SearchFacets';
import getCollectionLink from 'src/util/getCollectionLink';
import { queryCollectionXrefFacets } from 'src/queries';
import { selectSession, selectCollectionXrefResult } from 'src/selectors';

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
  }

  toggleXref() {
    this.setState(({ xrefIsOpen }) => ({ xrefIsOpen: !xrefIsOpen }));
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  renderTable() {
    const { intl, collection, result } = this.props;
    const linkPath = `${getCollectionLink(collection)}/xref/`;
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th className="entity">
              <span className="value">
                <FormattedMessage
                  id="xref.collection"
                  defaultMessage="Cross-referenced dataset"
                />
              </span>
            </th>
            <th className="numeric">
              <span className="value">
                <FormattedMessage
                  id="xref.matches"
                  defaultMessage="Matches"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {result.results.map(xref => (
            <tr key={xref.id}>
              <td className="numeric">
                <FormattedNumber value={xref.score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  render() {
    const { session, collection, query, result } = this.props;
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
            {result.total == 0 && (
              <ErrorSection
                icon="comparison"
                title={intl.formatMessage(messages.empty)}
              />
            )}
            {result.total === undefined && (
              <SectionLoading />
            )} 
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
  connect(mapStateToProps),
  injectIntl,
)(CollectionXrefMode);
