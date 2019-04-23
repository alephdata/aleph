import React, { PureComponent } from 'react';
import { Waypoint } from 'react-waypoint';
import { Button, Tooltip } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { deleteQueryLog, fetchQueryLogs } from 'src/actions/queryLogsActions';
import SectionLoading from 'src/components/common/SectionLoading';
import SearchAlert from 'src/components/SearchAlert/SearchAlert';
import { selectQueryLog } from 'src/selectors';
import Query from 'src/app/Query';

import './QueryLogs.scss';


const messages = defineMessages({
  title: {
    id: 'queryLogs.heading',
    defaultMessage: 'Manage your alerts',
  },
  save_button: {
    id: 'queryLogs.save',
    defaultMessage: 'Update',
  },
  add_placeholder: {
    id: 'queryLogs.add_placeholder',
    defaultMessage: 'Keep track of searches...',
  },
  no_alerts: {
    id: 'queryLogs.no_alerts',
    defaultMessage: 'You are not tracking any searches',
  },
  search_query: {
    id: 'queryLogs.query.search',
    defaultMessage: 'Search for {query}',
  },
  delete_query: {
    id: 'queryLogs.query.delete.tooltip',
    defaultMessage: 'Remove from search history',
  },
});

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
    const { intl, result } = this.props;
    return (
      <React.Fragment>
        { result.page !== undefined && result.results.length > 0 && (
          <table className="QueryLogs bp3-html-table">
            <tbody>
              {result.results.map(item => (
                <tr key={item.text}>
                  <td className="text">
                    <Tooltip
                      content={intl.formatMessage(messages.search_query, { query: item.text })}
                    >
                      <Button
                        minimal
                        icon="search"
                        onClick={() => this.onSearch(item.text)}
                        text={item.text}
                      />
                    </Tooltip>
                  </td>
                  <td className="narrow">
                    <SearchAlert queryText={item.text} />
                  </td>
                  <td className="narrow">
                    <Tooltip content={intl.formatMessage(messages.delete_query)}>
                      <Button
                        className="bp3-icon-cross"
                        minimal
                        onClick={() => this.props.deleteQueryLog(item)}
                      />
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-50px"
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
