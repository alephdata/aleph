import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router';
import Waypoint from 'react-waypoint';
import {selectQueryLog} from "src/selectors";
import Query from "src/app/Query";
import {deleteQueryLog, fetchQueryLogs} from "src/actions/queryLogsActions";
import {Button, Tooltip} from "@blueprintjs/core";
import SectionLoading from "../common/SectionLoading";
import {defineMessages, injectIntl} from "react-intl";
import queryString from "query-string";
import SearchAlert from "../SearchAlert/SearchAlert";

import './QueryLogs.scss'

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
  }
});

class QueryLogs extends PureComponent{
  componentDidMount() {
    this.fetchIfNeeded();
  }
  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading && result.shouldLoad) {
      this.props.fetchQueryLogs({query, next: result.next});
    }
  }
  onSearch(query) {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: query
      })
    });
    if(this.props.closeDialog){
      this.props.closeDialog()
    }
  }
  getMoreResults = () => {
    const {query, result, limit} = this.props;
    if (!limit && !result.isLoading && result.next) {
      this.props.fetchQueryLogs({ query, next: result.next });
    }
  };
  render(){
    const {intl, result} = this.props;
    return result.page !== undefined && result.results.length > 0 && (
      <table className="bp3-html-table querylog-table">
        <tbody>
        {result.results.map(item => (
          <tr key={item.text}>
            <td className="querylog-table--text">
              <b>{item.text}</b>
            </td>
            <td className="narrow">
              <Tooltip content={intl.formatMessage(messages.search_query, {query: item.text})}>
                <Button minimal={true}
                        className="bp3-icon-search"
                        onClick={() => this.onSearch(item.text)} />
              </Tooltip>
            </td>
            <td className="narrow">
                <SearchAlert queryText={item.text}/>
            </td>
            <td className="narrow">
              <Tooltip content={intl.formatMessage(messages.delete_query)}>
                <Button
                  className="bp3-icon-cross"
                  minimal={true}
                  onClick={() => this.props.deleteQueryLog(item)}/>
              </Tooltip>
            </td>
          </tr>
        ))}
        <tr>
          <td colSpan="4">
            <Waypoint onEnter={this.getMoreResults}
                      bottomOffset="-50px"
            />
            {result.isLoading && <SectionLoading/>}
          </td>
        </tr>
        </tbody>
      </table>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const query = Query.fromLocation('querylog', document.location, {}, 'queryLog').limit(20);
  const result = selectQueryLog(state, query);
  return { query, result };
};

const mapDispatchToProps = ({
  fetchQueryLogs,
  deleteQueryLog
});

QueryLogs = injectIntl(QueryLogs);
QueryLogs = withRouter(QueryLogs);
QueryLogs = connect(mapStateToProps, mapDispatchToProps)(QueryLogs);
export { QueryLogs };
export default QueryLogs;