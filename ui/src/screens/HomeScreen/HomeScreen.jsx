import React, { Component } from 'react';
import queryString from 'query-string';

import {
  ControlGroup, Divider, InputGroup,
} from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import {
  defineMessages, injectIntl,
} from 'react-intl';
import { fetchStatistics } from 'src/actions/index';
import { selectMetadata, selectSession, selectStatistics } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import StatisticsGroup from 'src/components/StatisticsGroup/StatisticsGroup';

import wordList from 'src/util/wordList';

import './HomeScreen.scss';


const messages = defineMessages({
  title: {
    id: 'home.title',
    defaultMessage: 'Find public records and leaks',
  },
  placeholder: {
    id: 'home.placeholder',
    defaultMessage: 'Try searching: {samples}',
  },
});

export class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = { query: '' };
    this.onChangeQuery = this.onChangeQuery.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    // for now, always load
    this.props.fetchStatistics();
  }

  onChangeQuery({ target }) {
    this.setState({ query: target.value });
  }

  onSubmit() {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: this.state.query,
      }),
    });
  }

  render() {
    const { intl, metadata, statistics = {} } = this.props;
    // if (session.loggedIn) {
    //   return <Redirect to="/notifications" />;
    // }
    const samples = wordList(metadata.app.samples, ', ').join('');
    return (
      <Screen
        isHomepage
        title={intl.formatMessage(messages.title)}
        description={metadata.app.description}
      >
        <section className="HomePage">
          <div className="outer-searchbox">
            <div className="inner-searchbox">
              <form onSubmit={this.onSubmit} className="search-form" autoComplete="off">
                <ControlGroup fill>
                  <InputGroup
                    id="search-box"
                    large
                    autoFocus
                    leftIcon="search"
                    placeholder={intl.formatMessage(messages.placeholder, { samples })}
                    value={this.state.query}
                    onChange={this.onChangeQuery}
                  />
                </ControlGroup>
              </form>
              <StatisticsGroup statistics={statistics} />
              <Divider />
            </div>
          </div>
        </section>
      </Screen>
    );
  }
}

const mapStateToProps = state => ({
  statistics: selectStatistics(state),
  session: selectSession(state),
  metadata: selectMetadata(state),
});

export default compose(
  connect(mapStateToProps, { fetchStatistics }),
  injectIntl,
)(HomeScreen);
