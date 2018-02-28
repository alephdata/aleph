import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Helmet } from 'react-helmet';
import { FormattedMessage, FormattedNumber, injectIntl } from 'react-intl';

import { fetchCollection, fetchCollectionXrefMatches, fetchCollectionXrefIndex } from 'src/actions';
import Entity from 'src/components/EntityScreen/Entity';
import Screen from 'src/components/common/Screen';
import Date from 'src/components/common/Date';
import Country from 'src/components/common/Country';
import ScreenLoading from 'src/components/common/ScreenLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import { matchesKey } from 'src/selectors';
import getPath from 'src/util/getPath';

import './CollectionXrefScreen.css';


class CollectionXrefScreen extends Component {
  constructor() {
    super()

    this.onOtherChange = this.onOtherChange.bind(this)
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
    const { collectionId, otherId } = this.props;
    this.props.fetchCollection({ id: collectionId });
    this.props.fetchCollection({ id: otherId });
    this.props.fetchCollectionXrefMatches(collectionId, otherId);
    this.props.fetchCollectionXrefIndex(collectionId);
  }

  onOtherChange({ target }) {
    const { collection, otherId, history } = this.props;
    if (otherId !== target.value) {
      history.push({
        pathname: getPath(collection.links.ui) + '/xref/' + target.value
      })
    }
  }

  render() {
    const { collection, other, index, matches } = this.props;
    const loading = collection === undefined || collection.isFetching || other === undefined || other.isFetching;
    if (loading || !matches || !index) {
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
      </Screen>
      
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, otherId } = ownProps.match.params;
  const collection = state.collections[collectionId];
  const other = state.collections[otherId];
  const matchKey = matchesKey(collectionId, otherId);
  const matches = state.collectionXrefMatches[matchKey];
  const index = state.collectionXrefIndex[collectionId];
  return { collectionId, otherId, collection, other, matches, index };
};

CollectionXrefScreen = withRouter(injectIntl(CollectionXrefScreen));
export default connect(mapStateToProps, { fetchCollection, fetchCollectionXrefMatches, fetchCollectionXrefIndex })(CollectionXrefScreen);
