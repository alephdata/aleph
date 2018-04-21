import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import Waypoint from 'react-waypoint';

import Query from 'src/app/Query';
import { fetchCollection, fetchCollectionXrefIndex, queryXrefMatches } from 'src/actions';
import { Entity, Screen, Date, Country, ScreenLoading, SectionLoading, Breadcrumbs } from 'src/components/common';
import { selectCollection, selectCollectionXrefIndex, selectCollectionXrefMatches } from 'src/selectors';
import getPath from 'src/util/getPath';

import './CollectionsXrefScreen.css';


class CollectionsXrefScreen extends Component {
  constructor() {
    super();
    this.onOtherChange = this.onOtherChange.bind(this)
    this.onLoadMore = this.onLoadMore.bind(this)
  }

  componentDidMount() {
    this.fetchData()
  }

  componentDidUpdate(prevProps) {
    const { collectionId, otherId } = this.props;
    if (collectionId !== prevProps.collectionId || otherId !== prevProps.otherId) {
      this.fetchData();
    }
  }

  fetchData() {
    const { collectionId, otherId, index, query } = this.props;
    const { collection, other } = this.props;
    if (collection.id === undefined) {
      this.props.fetchCollection({ id: collectionId });
    }
    if (other.id === undefined) {
      this.props.fetchCollection({ id: otherId });
    }
    if (index.total === undefined) {
      this.props.fetchCollectionXrefIndex({id: collectionId});
    }
    this.props.queryXrefMatches({ query });
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
    const { collection, other, index, matches } = this.props;
    if (collection.id === undefined || other.id === undefined || index.total === undefined) {
      return <ScreenLoading />;
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
      <Screen title={collection.label} breadcrumbs={breadcrumbs}>
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
            { matches.total === undefined && (
              <tr key="loading">
                <td colSpan="7">
                  <SectionLoading />
                </td>
              </tr>
            )}
            { matches.total !== undefined && matches.results.map((match) => (
              <tr key={match.id}>
                <td className="numeric narrow">
                  <FormattedNumber value={parseInt(match.score, 10)} />
                </td>
                <td className="entity">
                  <Entity.Link entity={match.entity} preview={true} icon />
                </td>
                <td className="date">
                  <Date.Earliest values={match.entity.dates} />
                </td>
                <td>
                  <Country.List codes={match.entity.countries} short />
                </td>
                <td className="entity">
                  <Entity.Link entity={match.match} preview={true} icon />
                </td>
                <td className="date">
                  <Date.Earliest values={match.match.dates} />
                </td>
                <td>
                  <Country.List codes={match.match.countries} short />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        { !matches.isExpanding && matches.next && (
          <Waypoint
            onEnter={this.onLoadMore}
            bottomOffset="-600px"
            scrollableAncestor={window}
          />
        )}
        { matches.isLoading && (
          <SectionLoading />
        )}
      </Screen>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, otherId } = ownProps.match.params;
  const path = `collections/${collectionId}/xref/${otherId}`;
  const query = new Query(path, {}).limit(50);
  return {
    collectionId, otherId, query,
    collection: selectCollection(state, collectionId),
    other: selectCollection(state, otherId),
    matches: selectCollectionXrefMatches(state, query),
    index: selectCollectionXrefIndex(state, collectionId)
  };
};

CollectionsXrefScreen = withRouter(CollectionsXrefScreen);
CollectionsXrefScreen = connect(mapStateToProps, {
  fetchCollection,
  fetchCollectionXrefIndex,
  queryXrefMatches
})(CollectionsXrefScreen);

export default CollectionsXrefScreen;