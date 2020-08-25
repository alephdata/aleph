import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown/with-html';
import queryString from 'query-string';
import { Redirect } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';

import { AnimatedCount, SearchBox } from 'components/common';
import { fetchStatistics } from 'actions/index';
import { selectMetadata, selectSession, selectStatistics } from 'selectors';
import Screen from 'components/Screen/Screen';
import StatisticsGroup from 'components/StatisticsGroup/StatisticsGroup';

import wordList from 'util/wordList';

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
  count_entities: {
    id: 'home.counts.entities',
    defaultMessage: 'Public entities',
  },
  count_datasets: {
    id: 'home.counts.datasets',
    defaultMessage: 'Public datasets',
  },
  count_countries: {
    id: 'home.counts.countries',
    defaultMessage: 'Countries & territories',
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
    const appHomePage = metadata.pages.find(page => page.home);
    const isHtml = appHomePage.html;

    const samples = wordList(metadata.app.samples, ', ').join('');

    console.log('metadata home', appHomePage);
    console.log('stats', statistics);
    return (
      <Screen
        isHomepage
        title={intl.formatMessage(messages.title)}
        description={metadata.app.description}
      >
        <div className="HomeScreen">
          <section className="HomeScreen__section">
            <div className="HomeScreen__section__content">
              <h1 className="HomeScreen__title">{metadata.app.title}</h1>
              {appDescription && (
                <p className="HomeScreen__description">{appDescription}</p>
              )}
              <SearchBox
                onSearch={this.onSubmit}
                placeholder={intl.formatMessage(messages.placeholder, { samples })}
                inputProps={{ large: true, autoFocus: true }}
              />
              <div className="HomeScreen__thirds">
                <AnimatedCount
                  count={statistics.things}
                  isPending={statistics.isPending}
                  label={intl.formatMessage(messages.count_entities)}
                />
                <AnimatedCount
                  count={statistics.collections}
                  isPending={statistics.isPending}
                  label={intl.formatMessage(messages.count_datasets)}
                />
                <AnimatedCount
                  count={statistics.countries?.size}
                  isPending={statistics.isPending}
                  label={intl.formatMessage(messages.count_countries)}
                />
              </div>
            </div>
          </section>
          {appHomePage.content && (
            <ReactMarkdown
              escapeHtml={!isHtml}
            >
              {appHomePage.content}
            </ReactMarkdown>
          )}
          <section className="HomeScreen__section">
            <div className="HomeScreen__section__content">
              <StatisticsGroup statistics={statistics} />
            </div>
          </section>
          <section className="HomeScreen__section">
            <div className="HomeScreen__section__content">
            {/* Aleph technical details: version, link to docs, github, etc. */}
            </div>
          </section>
        </div>
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
