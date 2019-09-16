import React, { Component, PureComponent } from 'react';
import _ from 'lodash';
import c from 'classnames';
import queryString from 'query-string';
import {
  defineMessages, FormattedMessage, FormattedNumber, injectIntl,
} from 'react-intl';
import { Link } from 'react-router-dom';
import {
  Button, ControlGroup, Divider, Callout,
} from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { fetchStatistics } from 'src/actions/index';
import { selectMetadata, selectSession, selectStatistics } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import SearchBox from 'src/components/common/SearchBox';
import {
  Category, Country, Schema, Numeric,
  DualPane, SignInCallout, Role,
} from 'src/components/common';

import './HomeScreen.scss';


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

class Statistics extends PureComponent {
  static Item({
    ItemContentContainer = Statistics.ItemContentContainer,
    item: [name, count],
    ...rest
  }) {
    return (
      <li {...rest}>
        <ItemContentContainer name={name} count={count} />
      </li>
    );
  }

  static Noop(props) { return <div key={props.key} className={props.className}>skeleton</div>; }

  constructor(props) {
    super(props);
    this.state = { listLen: 15 };
    this.onExpand = this.onExpand.bind(this);
  }

  onExpand() {
    const expandIncrement = 30;
    this.setState(prevState => ({ listLen: prevState.listLen + expandIncrement }));
  }

  render() {
    const {
      statistic,
      seeMoreButtonText,
      headline,
      isLoading,
      children = isLoading ? Statistics.Noop : Statistics.Item,
      ItemContentContainer = Statistics.ItemContentContainer,
    } = this.props;
    const {
      listLen,
    } = this.state;
    const list = isLoading ? Array.from(
      { length: 40 }, (i, ii) => ([ii]),
    ) : Object.entries(statistic);
    const rest = list.length - listLen;
    return (
      <div className="statistic bp3-callout">
        <h5 className={c('bp3-heading', 'statistic--headline', { 'bp3-skeleton': isLoading })}>{headline}</h5>
        <ul className="statistic--list">
          {_.sortBy(list, [1]).splice(-listLen).reverse().map(item => children({
            className: c('statistic--list-item', { 'bp3-skeleton': isLoading }),
            key: item[0],
            item,
            ItemContentContainer,
          }))}
          {rest > 0 && !isLoading && (
            <li className={c('statistic--list-item', { 'bp3-skeleton': isLoading })}>
              <Button
                onClick={this.onExpand}
                text={seeMoreButtonText(rest)}
              />
            </li>
          )}
        </ul>
      </div>
    );
  }
}


export class HomeScreen extends Component {
  static SubNavigation = function SubNavigation(props) {
    const { session, statistics } = props;
    if (session.loggedIn && statistics.groups && statistics.groups.length) {
      return (
        <React.Fragment>
          <Callout className="SignInCallout bp3-icon-path-search bp3-intent-primary">
            <FormattedMessage
              id="search.callout_message.signedIn"
              defaultMessage="You are part of {roles} - click to see the associated sources."
              values={{ roles: <Role.List roles={statistics.groups} /> }}
            />
          </Callout>
        </React.Fragment>
      );
    }
    return <SignInCallout />;
  }

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
    const { intl, metadata, statistics = {} } = this.props;
    const samples = metadata.app.samples.join(', ');

    const searchScope = {
      label: 'OCCRP Aleph',
      placeholder: intl.formatMessage(messages.search_placeholder, { samples }),
      filter: '',
    };

    return (
      <Screen
        isHomepage
        title={intl.formatMessage(messages.title)}
        description={metadata.app.description}
      >
        <HomeScreen.SubNavigation session={this.props.session} statistics={statistics} />
        <section className="HomePage">
          <div className="outer-searchbox">
            <div className="inner-searchbox">
              <form onSubmit={this.onSubmit} className="search-form" autoComplete="off">
                <ControlGroup fill>
                  <SearchBox
                    id="search-box"
                    doSearch={this.doSearch}
                    updateSearchValue={this.updateSearchValue}
                    searchValue={this.state.value}
                    searchScopes={[searchScope]}
                    inputClasses="bp3-large"
                  />
                </ControlGroup>
              </form>
              <DualPane className="statistics-list">
                <Statistics
                  headline={(
                    <FormattedMessage
                      id="home.statistics.schemata"
                      defaultMessage="Search {things} entities"
                      values={{
                        things: <Numeric num={statistics.things} abbr />,
                      }}
                    />
                  )}
                  seeMoreButtonText={restCount => (
                    <FormattedMessage
                      id="home.statistics.othertypes"
                      defaultMessage="{count} more entity types"
                      values={{
                        count: restCount,
                      }}
                    />
                  )}
                  statistic={statistics.schemata}
                  isLoading={!statistics.schemata}
                  ItemContentContainer={props => (
                    <Schema.Smart.Link url={`/search?filter:schema=${props.name}`} schema={props.name} {...props}>
                      <Numeric num={props.count} />
                    </Schema.Smart.Link>
                  )}
                />
                <Statistics
                  headline={(
                    <FormattedMessage
                      id="home.statistics.categories"
                      defaultMessage="from {collections} sources"
                      values={{
                        collections: <FormattedNumber value={statistics.collections || 0} />,
                      }}
                    />
                  )}
                  seeMoreButtonText={restCount => (
                    <FormattedMessage
                      id="home.statistics.other"
                      defaultMessage="{count} more sources"
                      values={{
                        count: restCount,
                      }}
                    />
                  )}
                  statistic={statistics.categories}
                  isLoading={!statistics.categories}
                  ItemContentContainer={props => (
                    <Link
                      to={`/sources?collectionsfilter:category=${props.name}`}
                    >
                      <Category category={props.name} />
                      <Numeric num={props.count} />
                    </Link>
                  )}
                />
                <Statistics
                  headline={(
                    <FormattedMessage
                      id="home.statistics.countries"
                      defaultMessage="in {count} countries"
                      values={{
                        count: _.size(statistics.countries),
                      }}
                    />
                  )}
                  seeMoreButtonText={restCount => (
                    <FormattedMessage
                      id="home.statistics.territories"
                      defaultMessage="{count} more countries & territories"
                      values={{
                        count: restCount,
                      }}
                    />
                  )}
                  statistic={statistics.countries}
                  isLoading={!statistics.countries}
                  ItemContentContainer={props => (
                    <Link to={`/sources?collectionsfilter:countries=${props.name}`}>
                      <Country.Name {...props} code={props.name} />
                      <Numeric num={props.count} />
                    </Link>
                  )}
                />
              </DualPane>
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
const mapDispatchToProps = { fetchStatistics };

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(HomeScreen);
