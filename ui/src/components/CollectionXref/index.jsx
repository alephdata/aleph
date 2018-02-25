import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { NonIdealState } from '@blueprintjs/core';
import { FormattedMessage, FormattedNumber, defineMessages, injectIntl } from 'react-intl';

import { fetchCollection, fetchCollectionXrefMatches } from 'src/actions';
import Entity from 'src/components/EntityScreen/Entity';
import Screen from 'src/components/common/Screen';
import Date from 'src/components/common/Date';
import Country from 'src/components/common/Country';
import ScreenLoading from 'src/components/common/ScreenLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import { matchesKey } from 'src/selectors';

import './CollectionXrefScreen.css';


class CollectionXrefScreen extends Component {
  componentDidMount() {
    this.fetchData()
  }

  componentDidUpdate(prevProps) {
    const { collectionId, otherId } = this.props;
    if (collectionId !== prevProps.collectionId) {
      this.fetchData();
    }
  }

  fetchData() {
    const { collectionId, otherId } = this.props;
    this.props.fetchCollection({ id: collectionId });
    this.props.fetchCollection({ id: otherId });
    this.props.fetchCollectionXrefMatches(collectionId, otherId);
  }

  render() {
    const { collection, other, matches } = this.props;
    const loading = collection === undefined || collection.isFetching || other === undefined || other.isFetching;
    if (loading || !matches) {
      return <ScreenLoading />;
    }
    
    return (
      <Screen>
        <Helmet>
          <title>{collection.label}</title>
        </Helmet>
        <Breadcrumbs collection={collection} />
        <table className="CollectionXrefScreen data-table">
          <thead>
            <tr>
              <th></th>
              <th colSpan="3">
                {collection.label}
              </th>
              <th colSpan="3">
                {other.label}
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
      </Screen>
      
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, otherId } = ownProps.match.params;
  const matchKey = matchesKey(collectionId, otherId);
  const collection = state.collections[collectionId];
  const other = state.collections[otherId];
  const matches = state.collectionXrefMatches[matchKey];
  return { collectionId, otherId, collection, other, matches };
};

CollectionXrefScreen = injectIntl(CollectionXrefScreen);
export default connect(mapStateToProps, { fetchCollection, fetchCollectionXrefMatches })(CollectionXrefScreen);
