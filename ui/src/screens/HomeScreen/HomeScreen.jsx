import _ from 'lodash';
import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'
import { Redirect } from 'react-router-dom';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Callout, Intent } from '@blueprintjs/core';

import { AnimatedCount, SearchBox, Category, Country, Schema, Statistics } from 'components/common';
import { fetchStatistics } from 'actions/index';
import { selectMetadata, selectSession, selectStatistics } from 'selectors';
import Screen from 'components/Screen/Screen';
import wordList from 'util/wordList';

import './HomeScreen.scss';


const messages = defineMessages({
  title: {
    id: 'home.title',
    defaultMessage: 'Find public records and leaks',
  },
  access_disabled: {
    id: 'home.access_disabled',
    defaultMessage: 'Public access temporarily disabled',
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

    const appHomePage = metadata.pages.find(page => page.home);
    const { description, samples, title, warning_title, warning_body } = appHomePage;
    const samplesList = wordList(samples, ', ').join('');

    return (
      <Screen
        title={intl.formatMessage(messages.title)}
        description={description}
        exemptFromRequiredAuth
      >
        <div className="HomeScreen">
          <section className="HomeScreen__section title-section">
            <div className="HomeScreen__section__content">
              <h1 className="HomeScreen__app-title">{title}</h1>
              {description && (
                <p className="HomeScreen__description">{description}</p>
              )}
              {(warning_title || warning_body) && (
                <Callout intent={Intent.WARNING} className="HomeScreen__auth-warning" title={warning_title}>
                  {warning_body}
                </Callout>
              )}
              <div className="HomeScreen__search">
                <SearchBox
                  onSearch={this.onSubmit}
                  placeholder={intl.formatMessage(messages.placeholder, { samples: samplesList })}
                  inputProps={{ large: true, autoFocus: true }}
                />
                <div className="HomeScreen__thirds">
                  <AnimatedCount
                    count={statistics?.things}
                    isPending={statistics.isPending}
                    label={intl.formatMessage(messages.count_entities)}
                  />
                  <AnimatedCount
                    count={statistics?.collections}
                    isPending={statistics.isPending}
                    label={intl.formatMessage(messages.count_datasets)}
                  />
                  <AnimatedCount
                    count={_.size(statistics?.countries)}
                    isPending={statistics.isPending}
                    label={intl.formatMessage(messages.count_countries)}
                  />
                </div>

              </div>
            </div>
          </section>
          {appHomePage?.content && (
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
            >
              {appHomePage.content}
            </ReactMarkdown>
          )}
          <section className="HomeScreen__section">
            <div className="HomeScreen__section__content">
              <h1 className="HomeScreen__title">
                <FormattedMessage
                  id="home.stats.title"
                  defaultMessage="Get started exploring public data"
                />
              </h1>
              <div className="HomeScreen__thirds">
                <div>
                  <Statistics
                    styleType="dark"
                    headline={(
                      <FormattedMessage
                        id="home.statistics.schemata"
                        defaultMessage="Entity types"
                      />
                    )}
                    statistic={statistics.schemata}
                    isPending={statistics.isPending}
                    itemLink={value => ({
                      pathname: 'search',
                      search: queryString.stringify({ 'filter:schema': value })
                    })}
                    itemLabel={name => <Schema.Label schema={name} plural icon />}
                  />
                </div>
                <div>
                  <Statistics
                    styleType="dark"
                    headline={(
                      <FormattedMessage
                        id="home.statistics.categories"
                        defaultMessage="Dataset categories"
                      />
                    )}
                    statistic={statistics.categories}
                    isPending={statistics.isPending}
                    itemLink={value => ({
                      pathname: 'datasets',
                      search: queryString.stringify({ 'collectionsfilter:category': value })
                    })}
                    itemLabel={name => <Category.Label category={name} />}
                  />
                </div>
                <div>
                  <Statistics
                    styleType="dark"
                    headline={(
                      <FormattedMessage
                        id="home.statistics.countries"
                        defaultMessage="Countries and territories"
                      />
                    )}
                    statistic={statistics.countries}
                    isPending={statistics.isPending}
                    itemLink={value => ({
                      pathname: 'datasets',
                      search: queryString.stringify({ 'collectionsfilter:countries': value })
                    })}
                    itemLabel={name => <Country.Name code={name} />}
                  />
                </div>
              </div>
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
