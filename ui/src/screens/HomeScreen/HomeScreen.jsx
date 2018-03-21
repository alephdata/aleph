import React, {Component} from 'react';
import { Link } from 'react-router-dom';
import {connect} from 'react-redux';
import queryString from 'query-string';
import { defineMessages, injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import numeral from 'numeral';

import { fetchStatistics } from 'src/actions/index';
import Screen from 'src/components/common/Screen'

import './HomeScreen.css';

const messages = defineMessages({
  search_placeholder: {
    id: 'home.search_placeholder',
    defaultMessage: 'Try searching: {samples}',
  },
});

class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { statistics } = this.props;
    if (!statistics.isLoading && statistics.count === undefined) {
      this.props.fetchStatistics();
    }
  }

  onChange({target}) {
    this.setState({value: target.value})
  }

  onSubmit(event) {
    event.preventDefault();
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: this.state.value
      })
    });
  }

  render() {
    const {intl, metadata, statistics} = this.props;
    const total = statistics.count === undefined ? '' : numeral(statistics.count).format('0a');
    const collections = statistics.count === undefined ? '' : <FormattedNumber value={statistics.collections} />;
    const samples = metadata.app.samples.join(', ');

    return (
      <Screen isHomepage={true}>
        <section className='HomePage'>
          <div className='outer-searchbox'>
            <div className='inner-searchbox'>
              <div className='homepage-summary'>
              {total && collections && (
                <FormattedMessage id='home.summary'
                                  defaultMessage="Search {total} public records and leaks from {collections} sources"
                                  values={{
                                    total: total,
                                    collections: collections
                                  }}
                                  />
              )}
              </div>
              <form onSubmit={this.onSubmit} className="search-form">
                <div className="pt-input-group pt-large">
                  <span className="pt-icon pt-icon-search search_span"/>
                  <input className="pt-input search_input"
                         type="text"
                         placeholder={intl.formatMessage(messages.search_placeholder, { samples })}
                         dir="auto"
                         onChange={this.onChange}
                         value={this.state.value}
                         autoFocus/>
                </div>
              </form>
              
              <div className="calls-to-action">
                <a className="pt-button pt-large pt-icon-search" onClick={this.onSubmit}>
                  <FormattedMessage id='home.search'
                                    defaultMessage="Search" />
                </a>
                <Link className="pt-button pt-large pt-icon-database" to="/collections">
                  <FormattedMessage id='home.explore'
                                    defaultMessage="Browse sources" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Screen>
    );
  }
}

const mapStateToProps = state => ({
  statistics: state.statistics,
  metadata: state.metadata
});

HomeScreen = injectIntl(HomeScreen);
export default connect(mapStateToProps, {fetchStatistics})(HomeScreen);
