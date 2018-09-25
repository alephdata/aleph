import React, {Component} from 'react';
import {connect} from 'react-redux';
import queryString from 'query-string';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import numeral from 'numeral';
import { ControlGroup, Button, Intent } from "@blueprintjs/core";

import { fetchStatistics } from 'src/actions/index';
import { selectStatistics, selectMetadata } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import SearchBox from 'src/components/Navbar/SearchBox';

import './HomeScreen.css';

const messages = defineMessages({
  title: {
    id: 'home.title',
    defaultMessage: 'Find public records and leaks',
  },
  search_placeholder: {
    id: 'home.search_placeholder',
    defaultMessage: 'Try searching: {samples}',
  },
  home_search: {
    id: 'home.search',
    defaultMessage: 'Search',
  },
});

class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { statistics } = this.props;
    if (statistics.shouldLoad) {
      this.props.fetchStatistics();
    }
  }

  updateSearchValue = value => this.setState({value});

  onSubmit = event => event.preventDefault();

  handleSearchBtn = () => this.doSearch();

  doSearch = (searchValue = this.state.value) => {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: searchValue
      })
    });
  };

  render() {
    const { intl, metadata, statistics } = this.props;
    const samples = metadata.app.samples.join(', ');
    
    return (
      <Screen isHomepage={true} title={intl.formatMessage(messages.title)}>
        <section className='HomePage'>
          <div className='outer-searchbox'>
            <div className='inner-searchbox'>
              <div className='homepage-summary'>
              <FormattedMessage id='home.summary'
                                defaultMessage="Search {total} public records and leaks from {collections} sources"
                                values={{
                                  total: numeral(statistics.entities).format('0a'),
                                  collections: <FormattedNumber value={statistics.collections} />
                                }} />
              </div>
              <form onSubmit={this.onSubmit} className="search-form">
                <ControlGroup fill={true}>
                  <SearchBox
                    doSearch={this.doSearch}
                    updateSearchValue={this.updateSearchValue}
                    searchValue={this.state.value}
                    placeholder={intl.formatMessage(messages.search_placeholder, { samples })}
                  />
                  <Button
                    className="pt-large pt-fixed"
                    intent={Intent.PRIMARY}
                    onClick={this.handleSearchBtn}
                    text={
                      <React.Fragment>
                        {intl.formatMessage(messages.home_search)}
                      </React.Fragment>
                    }
                  />
                </ControlGroup>
              </form>
            </div>
          </div>
        </section>
      </Screen>
    );
  }
}

const mapStateToProps = state => ({
  statistics: selectStatistics(state),
  metadata: selectMetadata(state)
});

HomeScreen = injectIntl(HomeScreen);
export default connect(mapStateToProps, { fetchStatistics })(HomeScreen);
