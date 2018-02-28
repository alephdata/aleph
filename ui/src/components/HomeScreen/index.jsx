import React, {Component} from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import {Link} from 'react-router-dom';
import {defineMessages, injectIntl, FormattedMessage} from 'react-intl';

import Screen from '../../components/common/Screen';
import CollectionBrowser from '../../components/CollectionScreen/CollectionBrowser';
import { fetchStatistics } from '../../actions/index';
import Schema from 'src/components/common/Schema';

import './style.css';

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
      isOpen: false,
      topThree: []
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onFooterClick = this.onFooterClick.bind(this);
    this.getTopThreeStatistics = this.getTopThreeStatistics.bind(this);
  }

  componentDidMount() {
    if(!this.props.statistics.isLoaded) {
      this.props.fetchStatistics();
    }
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.statistics.isLoaded) {
      let topThree = this.getTopThreeStatistics(nextProps.statistics.schemata);
      this.setState({topThree})
    }
  }

  objectToList(list) {
    return Object.keys(list).map(function(k, index) {
      return {index:index, number:list[k], name: k, link: `/search?filter:schema=${k}`} });
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

  onFooterClick() {
    this.setState({isOpen: true});
    window.scrollTo(0, 0)
  }

  render() {
    const { intl } = this.props;
    const { topThree, isOpen } = this.state;
    const classNames = [
      'nav',
      isOpen && 'nav-open'
    ].filter(Boolean);

    return (
      <Screen>
        <div id='section1' className='HomePage'>
          <section>
            <div className='outer_searchbox_div'>
            <div className='inner_searchbox_div'>
              <h1 className="search_h1">
                <FormattedMessage id='home.search.title'
                                  defaultMessage="Follow The Money" />
              </h1>
              <form onSubmit={this.onSubmit} className="search_form">
                <div className="pt-input-group pt-large">
                  <span className="pt-icon pt-icon-search search_span"/>
                  <input className="pt-input search_input"
                         type="search"
                         placeholder={intl.formatMessage(messages.search_placeholder)}
                         dir="auto"
                         onChange={this.onChange}
                         value={this.state.value}/>
                </div>
              </form>
              <div className='top_three_group'>
                <h4>We have&nbsp;</h4>
                <Link to="/search"> <h4> 50 milions results</h4></Link>
                <h4>, including&nbsp;</h4>
              {topThree.length > 0 && topThree.map((item, index) => (
                <Link key={index} to={item.link}>
                    <h4 key={index + 2}> {item.number} <Schema.Label schema={item.name} plural={true}/>,&nbsp;</h4>
                  </Link>
              ))}
              <h4>etc.</h4>
              </div>
            </div>
            </div>
            <div className='homepage_collections_footer'>
              <a className='browse_collection_label' onClick={this.onFooterClick} href='#section2'>Want to browse collections?</a>
            </div>
          </section>
        </div>
        <div id='section2' className={classNames.join(' ')}>
          <CollectionBrowser />
        </div>
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
