import React, {Component} from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl, FormattedMessage, FormattedNumber} from 'react-intl';
import {debounce} from 'lodash';
import Waypoint from 'react-waypoint';

import Query from 'src/app/Query';
import {queryCollections} from 'src/actions';
import {selectCollectionsResult} from 'src/selectors';
import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import SearchFacets from 'src/components/Facet/SearchFacets';
import SectionLoading from 'src/components/common/SectionLoading';
import CalloutBox from 'src/components/common/CalloutBox';
import CollectionListItem from 'src/screens/CollectionScreen/CollectionListItem';
import AuthenticationDialog from 'src/dialogs/AuthenticationDialog';

import './CollectionsIndexScreen.css';

const messages = defineMessages({
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


class CollectionsIndexScreen extends Component {
  constructor(props) {
    super(props);
    const {intl} = props;

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
      ],
      isSignupOpen: false
    };

    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
    this.onChangeQueryPrefix = this.onChangeQueryPrefix.bind(this);
    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
    this.onSignin = this.onSignin.bind(this);
    this.toggleAuthentication = this.toggleAuthentication.bind(this);
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
    let {query} = this.props;
    this.props.queryCollections({query});
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

  onSignin() {
    this.setState({isSignupOpen: !this.state.isSignupOpen})
  }

  toggleAuthentication() {
    this.setState({isSignupOpen: !this.state.isSignupOpen})
  }

  render() {
    const {result, query, intl, metadata, session} = this.props;
    const {queryPrefix, isSignupOpen} = this.state;

    const breadcrumbs = (<Breadcrumbs>
      <li>
        <a className="pt-breadcrumb">
          <FormattedMessage id="collection.browser.breadcrumb"
                            defaultMessage="Sources overview"/>
        </a>
      </li>
    </Breadcrumbs>);

    return (
      <Screen className="CollectionsIndexScreen" breadcrumbs={breadcrumbs}>
        <DualPane>
          <DualPane.InfoPane>
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
                          updateQuery={this.updateQuery}/>
          </DualPane.InfoPane>
          <DualPane.ContentPane>
            <AuthenticationDialog auth={metadata.auth} isOpen={isSignupOpen} toggleDialog={this.toggleAuthentication}/>
            {!session.loggedIn && <CalloutBox onClick={this.onSignin} className='callout'/>}
            <ul className="results">
              {result.results.map(res =>
                <CollectionListItem key={res.id} collection={res}/>
              )}
              {!result.isLoading && result.next && (
                <Waypoint
                  onEnter={this.bottomReachedHandler}
                  scrollableAncestor={window}
                />
              )}
              {result.isLoading && (
                <SectionLoading/>
              )}
            </ul>
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const query = Query.fromLocation('collections', ownProps.location, {}, 'collections')
    .sortBy('count', true)
    .limit(30);

  return {
    query: query,
    result: selectCollectionsResult(state, query),
    metadata: state.metadata,
    session: state.session
  };
}

CollectionsIndexScreen = injectIntl(CollectionsIndexScreen);
CollectionsIndexScreen = connect(mapStateToProps, {queryCollections})(CollectionsIndexScreen);
export default CollectionsIndexScreen;
