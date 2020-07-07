import React, { Component } from 'react';
import queryString from 'query-string';
import { Redirect } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';

import { SearchBox } from 'src/components/common';
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
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    // for now, always load
    this.props.fetchStatistics();
  }

  onSubmit(queryText) {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: queryText,
      }),
    });
  }

  render() {
    const { intl, metadata, statistics = {}, session } = this.props;
    if (session.loggedIn) {
      return <Redirect to="/notifications" />;
    }

    const appDescription = metadata.app.description;

    const samples = wordList(metadata.app.samples, ', ').join('');
    return (
      <Screen
        isHomepage
        title={intl.formatMessage(messages.title)}
        description={metadata.app.description}
      >
        <section className="HomeScreen">
          <div className="HomeScreen__section title-section">
            <div className="HomeScreen__section__content">
              <div className="HomeScreen__text-container">
                <h1 className="HomeScreen__title">{metadata.app.title}</h1>
                {appDescription && (
                  <p className="HomeScreen__description">{appDescription}</p>
                )}
              </div>
              <SearchBox
                onSearch={this.onSubmit}
                placeholder={intl.formatMessage(messages.placeholder, { samples })}
                inputProps={{ large: true, autoFocus: true }}
              />
              <StatisticsGroup statistics={statistics} />
            </div>
          </div>
        </section>
      </Screen>
    );
  }
}

const mapStateToProps = (state) => ({
  statistics: selectStatistics(state),
  session: selectSession(state),
  metadata: selectMetadata(state),
});

export default compose(
  connect(mapStateToProps, { fetchStatistics }),
  injectIntl,
)(HomeScreen);
