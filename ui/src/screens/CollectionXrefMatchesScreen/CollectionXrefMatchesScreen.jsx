import React, { Component } from 'react';
import { Icon } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import {
  defineMessages, FormattedMessage, FormattedNumber, injectIntl,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Waypoint } from 'react-waypoint';
import {
  Entity, Date, Country, SectionLoading, Breadcrumbs,
} from 'src/components/common';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import Query from 'src/app/Query';
import { fetchCollection, fetchCollectionXrefIndex, queryXrefMatches } from 'src/actions';
import { selectCollection, selectCollectionXrefIndex, selectCollectionXrefMatches } from 'src/selectors';
import getCollectionLink from 'src/util/getCollectionLink';

import './CollectionXrefMatchesScreen.scss';

const messages = defineMessages({
  screen_title: {
    id: 'collections.xref.title',
    defaultMessage: 'Compare entities between collections',
  },
});


export class CollectionXrefMatchesScreen extends Component {
  constructor(props) {
    super(props);
    this.onOtherChange = this.onOtherChange.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  onOtherChange({ target }) {
    const { collection, otherId, history } = this.props;
    if (otherId !== target.value) {
      history.push({
        pathname: `${getCollectionLink(collection)}/xref/${target.value}`,
      });
    }
  }

  getMoreResults() {
    const { query, matches } = this.props;
    if (matches && !matches.isLoading && matches.next && !matches.isError) {
      this.props.queryXrefMatches({ query, next: matches.next });
    }
  }

  fetchIfNeeded() {
    const {
      collectionId, otherId, index, query,
    } = this.props;
    const { collection, other, matches } = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({ id: collectionId });
    }
    if (other.shouldLoad) {
      this.props.fetchCollection({ id: otherId });
    }
    if (index.shouldLoad) {
      this.props.fetchCollectionXrefIndex({ id: collectionId });
    }
    if (matches.shouldLoad) {
      this.props.queryXrefMatches({ query });
    }
  }

  renderXrefTable() {
    const { other, index, matches } = this.props;
    return (
      <React.Fragment>
        <table className="CollectionXrefMatchesScreen data-table">
          <thead>
            <tr>
              <th />
              <th colSpan="3" width="45%">
                <FormattedMessage
                  id="matches.screen.title"
                  defaultMessage="Compare entities between collections"
                />
              </th>
              <th colSpan="3" width="45%">
                <div className="bp3-select bp3-fill">
                  <select id="other" onChange={this.onOtherChange} value={other.id}>
                    { index.results.map(res => (
                      <option key={res.collection.id} value={res.collection.id}>
                        {res.collection.label}
                        {' '}
                        (
                        {res.matches}
)
                      </option>
                    ))}
                  </select>
                </div>
              </th>
            </tr>
            <tr>
              <th className="numeric narrow">
                <FormattedMessage
                  id="xref.score"
                  defaultMessage="Score"
                />
              </th>
              <th>
                <FormattedMessage
                  id="xref.name"
                  defaultMessage="Name"
                />
              </th>
              <th>
                <FormattedMessage
                  id="xref.date"
                  defaultMessage="Date"
                />
              </th>
              <th>
                <FormattedMessage
                  id="xref.countries"
                  defaultMessage="Countries"
                />
              </th>
              <th>
                <FormattedMessage
                  id="xref.name"
                  defaultMessage="Name"
                />
              </th>
              <th>
                <FormattedMessage
                  id="xref.date"
                  defaultMessage="Date"
                />
              </th>
              <th>
                <FormattedMessage
                  id="xref.countries"
                  defaultMessage="Countries"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            { matches.total !== undefined && matches.results.map(match => (
              <tr key={match.id}>
                <td className="numeric narrow">
                  <FormattedNumber value={parseInt(parseFloat(match.score) * 100, 10)} />
                </td>
                {match.entity && (
                  <React.Fragment>
                    <td className="entity">
                      <Entity.Link entity={match.entity} preview icon />
                    </td>
                    <td className="date">
                      <Date.Earliest values={match.entity.getTypeValues('date')} />
                    </td>
                    <td>
                      <Country.List codes={match.entity.getTypeValues('country')} short />
                    </td>
                  </React.Fragment>
                )}
                {!match.entity && (
                  <td colSpan="3">
                    <FormattedMessage id="xref.missing" defaultMessage="(missing)" />
                  </td>
                )}
                {match.match && (
                  <React.Fragment>
                    <td className="entity">
                      <Entity.Link entity={match.match} preview icon />
                    </td>
                    <td className="date">
                      <Date.Earliest values={match.match.getTypeValues('date')} />
                    </td>
                    <td>
                      <Country.List codes={match.match.getTypeValues('country')} short />
                    </td>
                  </React.Fragment>
                )}
                {!match.match && (
                  <td colSpan="3">
                    <FormattedMessage id="xref.missing" defaultMessage="(missing)" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-600px"
          scrollableAncestor={window}
        />
        { matches.isLoading && (
          <SectionLoading />
        )}
      </React.Fragment>
    );
  }

  render() {
    const {
      collection, other, index, matches, intl,
    } = this.props;
    const error = collection.error || other.error || index.error || matches.error;

    if (error !== undefined) {
      return <ErrorScreen error={error} />;
    }
    if (collection.id === undefined || other.id === undefined || index.total === undefined) {
      return <LoadingScreen />;
    }
    const indexPath = `${getCollectionLink(collection)}#mode=xref`;
    return (
      <Screen title={intl.formatMessage(messages.screen_title)}>
        <Breadcrumbs>
          <Breadcrumbs.Collection collection={collection} />
          <li>
            <Link className="bp3-breadcrumb" to={indexPath}>
              <Icon icon="search-around" />
              <FormattedMessage id="matches.screen.xref" defaultMessage="Cross-reference" />
            </Link>
          </li>
          <Breadcrumbs.Text text={other.label} active />
        </Breadcrumbs>
        {this.renderXrefTable()}
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { collectionId, otherId } = ownProps.match.params;
  const path = `collections/${collectionId}/xref/${otherId}`;
  const query = new Query(path, location, {}, 'xref').limit(40);
  return {
    collectionId,
    otherId,
    query,
    collection: selectCollection(state, collectionId),
    other: selectCollection(state, otherId),
    matches: selectCollectionXrefMatches(state, query),
    index: selectCollectionXrefIndex(state, collectionId),
  };
};

const mapDispatchToProps = {
  fetchCollection,
  fetchCollectionXrefIndex,
  queryXrefMatches,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(CollectionXrefMatchesScreen);
