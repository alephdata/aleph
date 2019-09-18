import React, { PureComponent } from 'react';
import { Waypoint } from 'react-waypoint';
import { injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { deleteQueryLog, fetchQueryLogs } from 'src/actions/queryLogsActions';
import { SectionLoading, SearchListings } from 'src/components/common';
import { selectQueryLog } from 'src/selectors';
import Query from 'src/app/Query';

import './QueryLogs.scss';


export class QueryLogs extends PureComponent {
  componentDidMount() {
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
    const { query, result, limit } = this.props;
    if (!limit && !result.isLoading && result.next) {
      this.props.fetchQueryLogs({ query, next: result.next });
    }
  };

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading && result.shouldLoad) {
      this.props.fetchQueryLogs({ query, next: result.next });
    }
  }

  render() {
    const { result } = this.props;

    return (
      <React.Fragment>
        { result.page !== undefined && result.results.length > 0 && (
          <SearchListings
            listType="search history"
            items={result.results}
            onDelete={item => this.props.deleteQueryLog(item)}
            onSearch={item => this.onSearch(item.query)}
          />
        )}
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-30px"
          scrollableAncestor={window}
        />
        {result.isLoading && <SectionLoading />}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  const query = Query
    .fromLocation('querylog', document.location, {}, 'queryLog')
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
