import React, { Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import { debounce } from 'lodash';
import Waypoint from 'react-waypoint';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import Query from 'src/components/search/Query';
import DualPane from 'src/components/common/DualPane';
import ScreenLoading from 'src/components/common/ScreenLoading';
import SectionLoading from 'src/components/common/SectionLoading';
import CheckboxList from 'src/components/common/CheckboxList';
import { queryCollections } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import CollectionListItem from 'src/components/CollectionScreen/CollectionListItem';

import './CollectionsIndexScreen.css';

const messages = defineMessages({
  filter: {
    id: 'collectionbrowser.filter',
    defaultMessage: 'Filter collections',
  },
});


class CollectionsIndexScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      queryPrefix: props.query.getString('prefix')
    };

    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
    this.onChangeQueryPrefix = this.onChangeQueryPrefix.bind(this);
    this.onFacetToggle = this.onFacetToggle.bind(this);
    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchData();
    }
  }

  fetchData() {
    let { query } = this.props;
    this.props.queryCollections({query});
  }

  onChangeQueryPrefix({target}) {
    this.setState({queryPrefix: target.value});
    const query = this.props.query.set('prefix', target.value);
    this.updateQuery(query);
  }

  onFacetToggle(facet) {
    const updateQuery = this.updateQuery;
    return (value) => {
      let query = this.props.query;
      query = query.toggleFilter(facet, value);
      updateQuery(query);
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  bottomReachedHandler() {
    const { query, result } = this.props;
    if (!result.isLoading && result.next) {
      this.props.queryCollections({query, result, next: result.next});
    }
  }

  render() {
    const { result, intl } = this.props;
    const { queryPrefix } = this.state;
    if (!result.pages) {
      return <ScreenLoading />
    }

    const breadcrumbs = (<Breadcrumbs>
      <li>
        <a className="pt-breadcrumb">
          <FormattedMessage id="collection.browser.breadcrumb"
                            defaultMessage="Collections overview" />
        </a>
      </li>
    </Breadcrumbs>)

    return (
      <Screen className="CollectionsIndexScreen" breadcrumbs={breadcrumbs}>
        <DualPane>
          <DualPane.InfoPane>
            <div className="pt-input-group pt-fill">
              <i className="pt-icon pt-icon-search" />
              <input className="pt-input" type="search"
                placeholder={intl.formatMessage(messages.filter)}
                onChange={this.onChangeQueryPrefix} value={queryPrefix} />
            </div>
            { !result.isLoading && (
              <React.Fragment>
                <p className="note">
                  <FormattedMessage id="collection.browser.total"
                                  defaultMessage="Browsing {total} collections."
                                  values={{
                                    total: <FormattedNumber value={result.total} />
                                  }}/>
                </p>

                <h4>
                  <FormattedMessage id="collections.browser.categories"
                                    defaultMessage="Categories" />
                </h4>
                <CheckboxList items={result.facets.category.values}
                              selectedItems={result.facets.category.filters}
                              onItemClick={this.onFacetToggle('category')} />

                <h4>
                  <FormattedMessage id="collections.browser.countries"
                                    defaultMessage="Countries" />
                </h4>
                <CheckboxList items={result.facets.countries.values}
                              selectedItems={result.facets.countries.filters}
                              onItemClick={this.onFacetToggle('countries')} />
              </React.Fragment>
            )}
          </DualPane.InfoPane>
          <DualPane.ContentPane>
            <ul className="results">
              {result.results.map(res =>
                <CollectionListItem key={res.id} collection={res} />
              )}
              { !result.isLoading && result.next && (
                <Waypoint
                  onEnter={this.bottomReachedHandler}
                  scrollableAncestor={window}
                />
              )}
              { result.isLoading && (
                <SectionLoading />
              )}
            </ul>
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const query = Query.fromLocation('collections', ownProps.location, {})
    .sortBy('count', true)
    .addFacet('category')
    .addFacet('countries')
    .limit(30);

return {
    query: query,
    result: selectCollectionsResult(state, query)
  };
}

CollectionsIndexScreen = injectIntl(CollectionsIndexScreen);
CollectionsIndexScreen = connect(mapStateToProps, { queryCollections })(CollectionsIndexScreen);
export default CollectionsIndexScreen;
