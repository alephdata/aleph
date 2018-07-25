import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber} from 'react-intl';
import Waypoint from 'react-waypoint';

import { Entity, Date, Country, SectionLoading, Breadcrumbs } from 'src/components/common';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import CaseContext from "src/components/Case/CaseContext";
import Query from 'src/app/Query';
import { fetchCollection, fetchCollectionXrefIndex, queryXrefMatches } from 'src/actions';
import { selectCollection, selectCollectionXrefIndex, selectCollectionXrefMatches } from 'src/selectors';
import getPath from 'src/util/getPath';

import './CollectionsXrefScreen.css';

const messages = defineMessages({
  title: {
    id: 'collections.xref.title',
    defaultMessage: 'Compare entities between collections'
  }
});


class CollectionsXrefScreen extends Component {
  constructor() {
    super();
    this.onOtherChange = this.onOtherChange.bind(this)
    this.onLoadMore = this.onLoadMore.bind(this)
  }

  componentDidMount() {
    this.fetchIfNeeded()
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collectionId, otherId, index, query } = this.props;
    const { collection, other, matches } = this.props;
    if (collection.shouldLoad) {
      this.props.fetchCollection({ id: collectionId });
    }
    if (other.shouldLoad) {
      this.props.fetchCollection({ id: otherId });
    }
    if (index.shouldLoad) {
      this.props.fetchCollectionXrefIndex({id: collectionId});
    }
    if (matches.shouldLoad) {
      this.props.queryXrefMatches({ query });
    }
  }

  onOtherChange({ target }) {
    const { collection, otherId, history } = this.props;
    if (otherId !== target.value) {
      history.push({
        pathname: getPath(collection.links.ui) + '/xref/' + target.value
      })
    }
  }

  onLoadMore() {
    const { query, matches } = this.props;
    if (!matches.isLoading && matches.next) {
      this.props.queryXrefMatches({query, next: matches.next});
    }
  }

  render() {
    const { collection, other, index, matches, intl } = this.props;
    const error = collection.error || other.error || index.error || matches.error;
    if (error !== undefined) {
      return <ErrorScreen error={error} />
    }
    if (collection.id === undefined || other.id === undefined || index.total === undefined) {
      return <LoadingScreen />;
    }

    const breadcrumbs = (<Breadcrumbs collection={collection}>
      <li>
        <a className="pt-breadcrumb">
          <FormattedMessage id="collection.xref.crumb"
                            defaultMessage="Cross-referencing"/>
        </a>
      </li>
    </Breadcrumbs>)
    
    return (
      <Screen title={intl.formatMessage(messages.title)} breadcrumbs={breadcrumbs}>
        <CaseContext collection={collection} activeTab='Xref'>
          <table className="CollectionXrefScreen data-table">
            <thead>
              <tr>
                <th></th>
                <th colSpan="3" width="45%">
                  {collection.label}
                </th>
                <th colSpan="3" width="45%">
                  <div className="pt-select pt-fill">
                    <select id="other" onChange={this.onOtherChange} value={other.id}>
                      { index.results.map((res) => (
                        <option key={res.collection.id} value={res.collection.id}>
                          {res.collection.label} ({res.matches})
                        </option>
                      ))}
                    </select>
                  </div>
                </th>
              </tr>
              <tr>
                <th className="numeric narrow">
                  <FormattedMessage id="xref.score"
                                    defaultMessage="Score" />
                </th>
                <th>
                  <FormattedMessage id="xref.name"
                                    defaultMessage="Name" />
                </th>
                <th>
                  <FormattedMessage id="xref.date"
                                    defaultMessage="Date" />
                </th>
                <th>
                  <FormattedMessage id="xref.countries"
                                    defaultMessage="Countries" />
                </th>
                <th>
                  <FormattedMessage id="xref.name"
                                    defaultMessage="Name" />
                </th>
                <th>
                  <FormattedMessage id="xref.date"
                                    defaultMessage="Date" />
                </th>
                <th>
                  <FormattedMessage id="xref.countries"
                                    defaultMessage="Countries" />
                </th>
              </tr>
            </thead>
            <tbody>
              { matches.total !== undefined && matches.results.map((match) => (
                <tr key={match.id}>
                  <td className="numeric narrow">
                    <FormattedNumber value={parseInt(match.score, 10)} />
                  </td>
                  {match.entity && (
                    <React.Fragment>
                      <td className="entity">
                        <Entity.Link entity={match.entity} preview={true} icon />
                      </td>
                      <td className="date">
                        <Date.Earliest values={match.entity.dates} />
                      </td>
                      <td>
                        <Country.List codes={match.entity.countries} short />
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
                        <Entity.Link entity={match.match} preview={true} icon />
                      </td>
                      <td className="date">
                        <Date.Earliest values={match.match.dates} />
                      </td>
                      <td>
                        <Country.List codes={match.match.countries} short />
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
          { !matches.isExpanding && matches.next && (
            <Waypoint onEnter={this.onLoadMore}
                      bottomOffset="-600px"
                      scrollableAncestor={window}
            />
          )}
          { matches.isLoading && (
            <SectionLoading />
          )}
        </CaseContext>
      </Screen>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { collectionId, otherId } = ownProps.match.params;
  const path = `collections/${collectionId}/xref/${otherId}`;
  const query = new Query(path, location, {}, 'xref').limit(40);
  return {
    collectionId, otherId, query,
    collection: selectCollection(state, collectionId),
    other: selectCollection(state, otherId),
    matches: selectCollectionXrefMatches(state, query),
    index: selectCollectionXrefIndex(state, collectionId)
  };
};

CollectionsXrefScreen = withRouter(CollectionsXrefScreen);
CollectionsXrefScreen = injectIntl(CollectionsXrefScreen);
CollectionsXrefScreen = connect(mapStateToProps, {
  fetchCollection,
  fetchCollectionXrefIndex,
  queryXrefMatches
})(CollectionsXrefScreen);

export default CollectionsXrefScreen;