import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage, FormattedNumber } from 'react-intl';
import { debounce } from 'lodash';
import Waypoint from 'react-waypoint';

import Query from '../SearchScreen/Query';
import SectionLoading from 'src/components/common/SectionLoading';
import { fetchCollections } from 'src/actions';
import CollectionCard from './CollectionCard';

import './CollectionBrowser.css';

class CollectionBrowser extends Component {
  constructor(props) {
    super(props);

    this.state = {
      result: {results: []},
      queryText: props.query.getQ(),
      isFetching: true,
    };

    this.fetchData = debounce(this.fetchData, 200);
    this.updateQuery = this.updateQuery.bind(this);
    this.onChangeQueryText = this.onChangeQueryText.bind(this);
    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchData();
    }
  }

  fetchData() {
    this.setState({isFetching: true})
    let { query } = this.props;
    query = query.limit(30);
    this.props.fetchCollections({
      filters: query.toParams(),
    }).then(({result}) => {
      this.setState({result, isFetching: false})
    });
  }

  onChangeQueryText({target}) {
    this.setState({queryText: target.value});
    const query = this.props.query.setQ(target.value);
    this.updateQuery(query);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  bottomReachedHandler() {
    const { result, isFetching } = this.state;
    if (!result || !result.next || isFetching) {
        return
    }
    this.setState({isFetching: true})
    const offset = result.offset || 0;
    let query = this.props.query;
    query = query.offset(offset + result.limit);
    query = query.limit(result.limit);
    this.props.fetchCollections({
      filters: query.toParams(),
    }).then(({result: fresh}) => {
      result.next = fresh.next;
      result.offset = fresh.offset;
      result.results.push(...fresh.results);
      this.setState({
            result: result,
            isFetching: false
        });
    });
  }

  render() {
    const { intl } = this.props;
    const { result, queryText, isFetching } = this.state;
    const { total = 0 } = result;
    return (
      <div className="CollectionBrowser">
        <div className="title">
          <div className="section">
            <h3>
                <FormattedMessage id="collection.browser.title"
                                defaultMessage="Browse {count} collections"
                                values={{
                                    count: (<FormattedNumber value={total} />)
                                }} />
            </h3>
          </div>
          <div className="section">
            <div className="pt-input-group">
                <span className="pt-icon pt-icon-search"></span>
                <input className="pt-input" type="search"
                    placeholder={intl.formatMessage({id: "collection.browser.filter", defaultMessage: "Filter collections" })}
                    onChange={this.onChangeQueryText} value={queryText} />
            </div>
          </div>
        </div>
        <div className="results">
          {result.results.map(res =>
            <div key={res.id} className="result">
              <CollectionCard collection={res} />
            </div>
          )}
          { result.next && (
            <Waypoint onEnter={this.bottomReachedHandler} />
          )}
          { isFetching && (
            <SectionLoading />
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    query: Query.fromLocation(ownProps.location, {}, 'co')
  };
}

CollectionBrowser = connect(mapStateToProps, { fetchCollections })(CollectionBrowser);
CollectionBrowser = injectIntl(withRouter(CollectionBrowser));
export default CollectionBrowser;
