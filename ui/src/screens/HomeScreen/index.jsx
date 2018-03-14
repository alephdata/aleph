import React, {Component} from 'react';
import {connect} from 'react-redux';
import queryString from 'query-string';
import { Link } from 'react-router-dom';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import numeral from 'numeral';

import Screen from 'src/components/common/Screen';
import {fetchStatistics} from 'src/actions/index';
import Schema from 'src/components/common/Schema';

import './HomeScreen.css';

const messages = defineMessages({
  search_placeholder: {
    id: 'home.search_placeholder',
    defaultMessage: 'Search companies, people and documents.',
  },
});

class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      topThree: [],
      count: 0
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.getTopThreeStatistics = this.getTopThreeStatistics.bind(this);
  }

  componentDidMount() {
    if (!this.props.statistics.isLoaded) {
      this.props.fetchStatistics();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.statistics.isLoaded) {
      let topThree = this.getTopThreeStatistics(nextProps.statistics.schemata);
      this.setState({topThree: topThree, count: nextProps.statistics.count})
    }
  }

  objectToList(list) {
    return Object.keys(list).map(function (k, index) {
      return {index: index, number: list[k], name: k, link: `/search?filter:schema=${k}`}
    });
  }

  sortNumbers(first, second) {
    return second.number - first.number;
  }

  getTopThreeStatistics(schemata) {
    let schemataList = this.objectToList(schemata);
    schemataList.sort(this.sortNumbers);
    return schemataList.slice(0, 3);
  }

  onChange({target}) {
    this.setState({value: target.value})
  }

  onSubmit(event) {
    const {history} = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: this.state.value
      })
    });
    this.setState({value: ''});
    event.preventDefault();
  }

  render() {
    const {intl} = this.props;
    const {topThree, count} = this.state;

    return (
      <Screen isHomepage={true}>
        <section className='HomePage'>
          <div className='outer-searchbox-div'>
            <div className='inner-searchbox-div'>
              <h1 className="search-h1">
                <FormattedMessage id='home.search.title'
                                  defaultMessage="Follow The Money"/>
              </h1>
              <div className='homepage-summary'>
                <h4>
                  <FormattedMessage id='home.summary'
                                    defaultMessage="Search public records, databases and leaks from hundreds of global sources."/>
                </h4>
              </div>
              <form onSubmit={this.onSubmit} className="search_form">
                <div className="pt-input-group pt-large">
                  <span className="pt-icon pt-icon-search search_span"/>
                  <input className="pt-input search_input"
                          type="text"
                          placeholder={intl.formatMessage(messages.search_placeholder)}
                          dir="auto"
                          onChange={this.onChange}
                          value={this.state.value}/>
                </div>
              </form>
              <div className='top-three-group'>
                <h4>We have&nbsp;</h4>
                <Link to="/search"><h4>{numeral(count).format('0a')} results</h4></Link>
                <h4>&nbsp;including&nbsp;</h4>
                {topThree.length > 0 && topThree.map((item, index) => (
                  <Link key={index} to={item.link}>
                    {index === 0 && <h4 key={index + 2}>{numeral(item.number).format('0a')}&nbsp;
                      <Schema.Label lowerCase={true} schema={item.name} plural={true}/>,&nbsp;
                    </h4>}
                    {index === 1 && <h4 key={index + 2}>{numeral(item.number).format('0a')}&nbsp;
                      <Schema.Label lowerCase={true} schema={item.name} plural={true}/>&nbsp;
                    </h4>}
                    {index === 2 && <h4 key={index + 2}>and {numeral(item.number).format('0a')}&nbsp;
                      <Schema.Label lowerCase={true} schema={item.name} plural={true}/>.
                    </h4>}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className='homepage_collections_footer'>
            <Link to="/collections">
              <FormattedMessage id='home.collections'
                                defaultMessage="Want to browse sources?"/>
            </Link>
          </div>
        </section>
      </Screen>
    );
  }
}

const mapStateToProps = state => ({
  collections: state.collections,
  statistics: state.statistics,
});

HomeScreen = injectIntl(HomeScreen);
export default connect(mapStateToProps, {fetchStatistics})(HomeScreen);
