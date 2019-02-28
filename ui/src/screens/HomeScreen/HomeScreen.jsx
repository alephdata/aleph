import React, { Component } from 'react';
import queryString from 'query-string';
import {
  defineMessages, FormattedMessage, FormattedNumber,
} from 'react-intl';
import numeral from 'numeral';
import { Button, ControlGroup, Intent } from '@blueprintjs/core';
import SearchBox from 'src/components/Navbar/SearchBox';

import { fetchStatistics } from 'src/actions/index';
import { selectMetadata, selectStatistics } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';

import './HomeScreen.scss';
import { translatableConnected } from '../OAuthScreen/enhancers';

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

const mapStateToProps = state => ({
  statistics: selectStatistics(state),
  metadata: selectMetadata(state),
});

export class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    // for now, always load
    this.props.fetchStatistics();
  }

  onChange({ target }) {
    this.setState({ value: target.value });
  }

  updateSearchValue = value => this.setState({ value });

  onSubmit = event => event.preventDefault();

  handleSearchBtn = () => this.doSearch();

  doSearch = (searchValue = this.state.value) => {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: searchValue,
      }),
    });
  };

  render() {
    const { intl, metadata, statistics } = this.props;
    const samples = metadata.app.samples.join(', ');

    return (
      <Screen isHomepage title={intl.formatMessage(messages.title)}>
        <section className="HomePage">
          <div className="outer-searchbox">
            <div className="inner-searchbox">
              <div className="homepage-summary">
                {statistics.entities && (
                  <FormattedMessage
                    id="home.summary"
                    defaultMessage="Search {total} public records and leaks from {collections} sources"
                    values={{
                      total: numeral(statistics.entities).format('0a'),
                      collections: <FormattedNumber value={statistics.collections} />,
                    }}
                  />
                )}
              </div>
              <form onSubmit={this.onSubmit} className="search-form" autoComplete="off">
                <ControlGroup fill>
                  <SearchBox
                    id="search-box"
                    doSearch={this.doSearch}
                    updateSearchValue={this.updateSearchValue}
                    searchValue={this.state.value}
                    placeholder={intl.formatMessage(messages.search_placeholder, { samples })}
                  />
                  <Button
                    className="bp3-large bp3-fixed"
                    intent={Intent.PRIMARY}
                    onClick={this.handleSearchBtn}
                    text={(
                      <React.Fragment>
                        {intl.formatMessage(messages.home_search)}
                      </React.Fragment>
)}
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

export default translatableConnected({
  mapStateToProps,
  mapDispatchToProps: { fetchStatistics },
});
