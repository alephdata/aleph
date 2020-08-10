import React, { PureComponent } from 'react';
import { Waypoint } from 'react-waypoint';
import { injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { deleteQueryLog, fetchQueryLogs } from 'actions/queryLogsActions';
import { SearchListings } from 'components/common';
import { selectQueryLog } from 'selectors';
import Query from 'app/Query';

import './QueryLogs.scss';


export class QueryLogs extends PureComponent {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  onSearch(query) {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: query,
      }),
    });
    if (this.props.closeDialog) {
      this.props.closeDialog();
    }
  }

  getMoreResults = () => {
    const { query, result } = this.props;
    if (!result.isPending && result.next) {
      this.props.fetchQueryLogs({ query, next: result.next });
    }
  };

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (result.shouldLoad) {
      this.props.fetchQueryLogs({ query });
    }
  }

  render() {
    const { result } = this.props;

    return (
      <div className="QueryLogs">
        <SearchListings
          listType="search history"
          result={result}
          onDelete={item => this.props.deleteQueryLog(item)}
          onSearch={item => this.onSearch(item.query)}
        />
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-30px"
          scrollableAncestor={window}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const query = Query
    .fromLocation('querylog', document.location, {}, 'querylog')
    .limit(20);
  const result = selectQueryLog(state, query);
  return { query, result };
};

const mapDispatchToProps = ({
  fetchQueryLogs,
  deleteQueryLog,
});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(QueryLogs);
