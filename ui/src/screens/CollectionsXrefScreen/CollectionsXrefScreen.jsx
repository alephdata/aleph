import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage, FormattedNumber, injectIntl } from 'react-intl';
import Waypoint from 'react-waypoint';

import {
    fetchCollection,
    fetchCollectionXrefMatches,
    fetchNextCollectionXrefMatches,
    fetchCollectionXrefIndex } from 'src/actions';
import Entity from 'src/screens/EntityScreen/Entity';
import Screen from 'src/components/common/Screen';
import Date from 'src/components/common/Date';
import Country from 'src/components/common/Country';
import ScreenLoading from 'src/components/common/ScreenLoading';
import SectionLoading from 'src/components/common/SectionLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import { matchesKey, selectCollection } from 'src/selectors';
import getPath from 'src/util/getPath';

import './CollectionsXrefScreen.css';


class CollectionsXrefScreen extends Component {
  constructor() {
    super()

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
    const { collectionId, otherId, index } = this.props;
    const { collection, other } = this.props;
    if (!collection || !collection.id) {
      this.props.fetchCollection({ id: collectionId });
    }
    if (!other || !other.id) {
      this.props.fetchCollection({ id: otherId });
    }
    if (!index || !index.total) {
      this.props.fetchCollectionXrefIndex(collectionId);
    }
    this.props.fetchCollectionXrefMatches(collectionId, otherId);
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
    const { collectionId, otherId, matches } = this.props;
    if (matches.next && !matches.isExpanding) {
      this.props.fetchNextCollectionXrefMatches(collectionId, otherId, matches);
    } 
  }

  render() {
    const { collection, other, index, matches } = this.props;
    const loading = !collection || !collection.id || !other || !other.id || !matches || !index;
    if (loading) {
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
              <th colSpan="3">
                {collection.label}
              </th>
              <th colSpan="3">
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
            { matches.results.map((match) => (
              <tr key={match.id}>
                <td className="numeric narrow">
                  <FormattedNumber value={parseInt(match.score, 10)} />
                </td>
                <td className="entity">
                  <Entity.Link entity={match.entity} icon />
                </td>
                <td className="date">
                  <Date.Earliest values={match.entity.dates} />
                </td>
                <td>
                  <Country.List codes={match.entity.countries} short />
                </td>
                <td className="entity">
                  <Entity.Link entity={match.match} icon />
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
        { matches.isExpanding && (
          <SectionLoading />
        )}
      </Screen>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, otherId } = ownProps.match.params;
  const collection = selectCollection(state, collectionId);
  const other = selectCollection(state, otherId);
  const matchKey = matchesKey(collectionId, otherId);
  const matches = state.collectionXrefMatches[matchKey];
  const index = state.collectionXrefIndex[collectionId];
  return { collectionId, otherId, collection, other, matches, index };
};

CollectionsXrefScreen = withRouter(injectIntl(CollectionsXrefScreen));
export default connect(mapStateToProps, {
  fetchCollection,
  fetchCollectionXrefMatches,
  fetchNextCollectionXrefMatches,
  fetchCollectionXrefIndex
})(CollectionsXrefScreen);
