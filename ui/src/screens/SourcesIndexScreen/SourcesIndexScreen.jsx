import React, {Component} from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, FormattedMessage, FormattedNumber} from 'react-intl';
import {debounce} from 'lodash';
import Waypoint from 'react-waypoint';

import Query from 'src/app/Query';
import {queryCollections} from 'src/actions';
import {selectCollectionsResult} from 'src/selectors';
import { Breadcrumbs, DualPane, SectionLoading, SignInCallout, ErrorSection } from 'src/components/common';
import SearchFacets from 'src/components/Facet/SearchFacets';
import QueryTags from 'src/components/QueryTags/QueryTags';
import Screen from 'src/components/Screen/Screen';
import { CollectionListItem } from 'src/components/Collection';

import './SourcesIndexScreen.css';

const messages = defineMessages({
  title: {
    id: 'collections.index.title',
    defaultMessage: 'Sources'
  },
  filter: {
    id: 'collectionbrowser.filter',
    defaultMessage: 'Filter sources',
  },
  facet_category: {
    id: 'search.facets.facet.category',
    defaultMessage: 'Categories',
  },
  facet_countries: {
    id: 'search.facets.facet.countries',
    defaultMessage: 'Countries',
  },
});


class SourcesIndexScreen extends Component {
  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = {
      queryPrefix: props.query.getString('prefix'),
      facets: [
        {
          field: 'category',
          label: intl.formatMessage(messages.facet_category),
          icon: 'list',
          defaultSize: 20
        },
        {
          field: 'countries',
          label: intl.formatMessage(messages.facet_countries),
          icon: 'globe',
          defaultSize: 300
        },
      ]
    };

    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
    this.onChangeQueryPrefix = this.onChangeQueryPrefix.bind(this);
    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    let { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryCollections({ query });
    }
  }

  onChangeQueryPrefix({target}) {
    this.setState({queryPrefix: target.value});
    const query = this.props.query.set('prefix', target.value);
    this.updateQuery(query);
  }

  updateQuery(newQuery) {
    const {history, location} = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  bottomReachedHandler() {
    const {query, result} = this.props;
    if (!result.isLoading && result.next) {
      this.props.queryCollections({query, result, next: result.next});
    }
  }

  render() {
    const { result, query, intl } = this.props;
    const { queryPrefix } = this.state;

    const breadcrumbs = (<Breadcrumbs>
      <li>
        <a className="pt-breadcrumb">
          <FormattedMessage id="collection.browser.breadcrumb"
                            defaultMessage="Sources overview"/>
        </a>
      </li>
    </Breadcrumbs>);

    return (
      <Screen className="SourcesIndexScreen"
              breadcrumbs={breadcrumbs}
              title={intl.formatMessage(messages.title)}>
        <DualPane>
          <DualPane.SidePane>
            <div className="pt-input-group pt-fill">
              <i className="pt-icon pt-icon-search"/>
              <input className="pt-input" type="search"
                     placeholder={intl.formatMessage(messages.filter)}
                     onChange={this.onChangeQueryPrefix} value={queryPrefix}/>
            </div>
            <p className="note">
              <FormattedMessage id="collection.browser.total"
                                defaultMessage="Browsing {total} sources."
                                values={{
                                  total: <FormattedNumber value={result.total || 0}/>
                                }}/>
            </p>
            <SearchFacets facets={this.state.facets}
                          query={query}
                          result={result}
                          updateQuery={this.updateQuery}/>
          </DualPane.SidePane>
          <DualPane.ContentPane>
            <SignInCallout />
            <QueryTags query={query} updateQuery={this.updateQuery}/>
            <ul className="results">
              {result.results !== undefined && result.results.map(res =>
                <CollectionListItem key={res.id} collection={res}/>
              )}
            </ul>
            {!result.isLoading && result.next && (
              <Waypoint
                onEnter={this.bottomReachedHandler}
                scrollableAncestor={window}
              />
            )}
            {result.isError && (
              <ErrorSection error={result.error} />
            )}
            {result.isLoading && (
              <SectionLoading />
            )}
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const context = {
    facet: ['category', 'countries'],
    'filter:kind': 'source'
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .sortBy('count', 'desc')
    .limit(40);
  return {
    query: query,
    result: selectCollectionsResult(state, query)
  };
};

SourcesIndexScreen = injectIntl(SourcesIndexScreen);
SourcesIndexScreen = connect(mapStateToProps, {queryCollections})(SourcesIndexScreen);
export default SourcesIndexScreen;
