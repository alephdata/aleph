import React from 'react';
import { defineMessages, injectIntl, FormattedNumber, FormattedMessage } from 'react-intl';
import { ButtonGroup, AnchorButton, Button } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Waypoint } from 'react-waypoint';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import c from 'classnames';

import { SectionLoading, ErrorSection, Entity, Collection } from 'src/components/common';
import CollectionXrefDialog from 'src/dialogs/CollectionXrefDialog/CollectionXrefDialog';
import SearchFacets from 'src/components/Facet/SearchFacets';
import Property from 'src/components/Property';
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

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollectionXref({ query });
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

  toggleXref() {
    this.setState(({ xrefIsOpen }) => ({ xrefIsOpen: !xrefIsOpen }));
  }

  renderRow(xref) {
    if (!xref.entity || !xref.match) {
      return null;
    }
    const { expandedId } = this.props;
    const isExpanded = xref.id === expandedId;
    const expandIcon = isExpanded ? 'chevron-up' : 'chevron-down';
    const mainRow = (
      <tr key={xref.id} className={c({ prefix: isExpanded })}>
        <td className="expand">
          <Button onClick={() => this.toggleExpand(xref)} small minimal icon={expandIcon} />
        </td>
        <td className="numeric narrow">
          <FormattedNumber value={parseInt(parseFloat(xref.score) * 100, 10)} />
        </td>
        <td className="entity">
          <Entity.Link entity={xref.entity} preview icon />
        </td>
        <td className="entity">
          <Entity.Link entity={xref.match} preview icon />
        </td>
        <td className="collection">
          <Collection.Link preview collection={xref.match_collection} icon />
        </td>
      </tr>
    );
    if (!isExpanded) {
      return mainRow;
    }
    const properties = [...xref.entity.schema.getFeaturedProperties()];
    xref.match.schema.getFeaturedProperties().forEach((prop) => {
      if (properties.indexOf(prop) === -1) {
        properties.push(prop);
      }
    });
    return [
      mainRow,
      ...properties.map((prop) => (
        <tr key={`${xref.id}-prop-${prop.name}`} className="prefix">
          <td colSpan={2} />
          <td>
            <strong>
              <Property.Values prop={prop} values={xref.entity.getProperty(prop)} />
            </strong>
          </td>
          <td>
            <strong>
              <Property.Values prop={prop} values={xref.match.getProperty(prop)} />
            </strong>
          </td>
          <td>
            <Property.Name prop={prop} />
          </td>
        </tr>
      )),
      <tr key={`${xref.id}-last`}>
        <td colSpan={5} />
      </tr>,
    ];
  }

  renderTable() {
    const { result } = this.props;
    if (!result.total || !result.results) {
      return null;
    }
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th className="expand" />
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
                  defaultMessage="Possible match"
                />
              </span>
            </th>
            <th className="collection">
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
          {result.results.map(xref => this.renderRow(xref))}
        </tbody>
      </table>
    );
  }

  render() {
    const { session, collection, query, result, intl } = this.props;
    return (
      <section className="CollectionXrefMode">
        <div className="pane-layout">
          <div className="pane-layout-main">
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
            {result.isPending && (
              <SectionLoading />
            )}
            <Waypoint
              onEnter={this.getMoreResults}
              bottomOffset="-300px"
              scrollableAncestor={window}
            />
          </div>
          <div className="pane-layout-side">
            <SearchFacets
              facets={['match_collection_id', 'schema', 'countries']}
              query={query}
              result={result}
              updateQuery={this.updateQuery}
            />
          </div>
        </div>
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
  const parsedHash = queryString.parse(location.hash);
  const query = queryCollectionXrefFacets(location, collection.id);
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
