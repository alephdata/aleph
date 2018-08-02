import React, {Component} from 'react';
import Waypoint from 'react-waypoint';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';

import Query from 'src/app/Query';
import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import EntityTable from 'src/components/EntityTable/EntityTable';
import { SectionLoading, ErrorSection } from 'src/components/common';

const messages = defineMessages({
  no_results_title: {
    id: 'entity.search.no_results_title',
    defaultMessage: 'No search results',
  },
  no_results_description: {
    id: 'entity.search.no_results_description',
    defaultMessage: 'Try making your search more general',
  },
  empty_title: {
    id: 'entity.search.empty_title',
    defaultMessage: 'This folder is empty',
  }
});


class EntitySearch extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedRows: [],
      refreshCallout: false
    };

    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.checkPendingState = this.checkPendingState.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
    this.checkPendingState();
  }

  checkPendingState() {
    const { result } = this.props;

    let test = result.results.filter(function(data){
      return data.status === "pending"
    });

    if(test.length !== 0 && this.state.refreshCallout !== true) {
      this.setState({refreshCallout: true});
      this.props.setRefreshCallout();
    }
  }

  fetchIfNeeded() {
    const { query, result, queryEntities } = this.props;
    if (result.shouldLoad) {
      queryEntities({ query });
    }
  }

  getMoreResults() {
    const {query, result, queryEntities} = this.props;
    if (result && result.next) {
      queryEntities({query, next: result.next});
    }
  }

  updateQuery(newQuery) {
    if (this.props.updateQuery !== undefined) {
      return this.props.updateQuery(newQuery);
    }
    const {history, location} = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  updateSelection(entity) {
    let selectedRows = [];
    if(entity === null) { //if user clicked select all
      if(this.props.result.results.length === this.state.selectedRows.length) {
        this.setState({selectedRows: selectedRows});
      } else {
        if(this.props.result.results !== undefined) {
          this.props.result.results.map(entity => selectedRows.push(entity))
        }

        this.setState({selectedRows: selectedRows });
      }
    } else { //if user clicked on row
      selectedRows = this.state.selectedRows;
      let indexOfSelectedRow = -1;
      for(let i = 0; i < selectedRows.length; i++){
        if(selectedRows[i].id === entity.id) indexOfSelectedRow = i;
      }
      if(indexOfSelectedRow === -1) {
        selectedRows.push(entity);
        this.setState({selectedRows: selectedRows});
      } else {
        selectedRows.splice(indexOfSelectedRow, 1);
        this.setState({selectedRows: selectedRows});
      }
    }

    this.props.disableOrEnableDelete(selectedRows.length === 0);
    this.props.setDocuments(selectedRows);
  }

  render() {
    const { query, result, intl, className, writeable } = this.props;
    const { selectedRows } = this.state;
    const isEmpty = !query.hasQuery();

    return (
      <div className={className}>
        {result.total === 0 && (
          <section className="PartialError">
            { !isEmpty && (
              <ErrorSection visual='search'
                            title={intl.formatMessage(messages.no_results_title)}
                            description={intl.formatMessage(messages.no_results_description)} />
            )}
            { isEmpty && (
              <ErrorSection visual='folder-open'
                            title={intl.formatMessage(messages.empty_title)} />
            )}
          </section>
        )}
        <EntityTable query={query}
                     documentMode={this.props.documentMode}
                     hideCollection={this.props.hideCollection}
                     updateQuery={this.updateQuery}
                     result={result}
                     writeable={writeable}
                     updateSelection={this.updateSelection}
                     selectedRows={selectedRows}/>
        {!result.isLoading && result.next && (
          <Waypoint
            onEnter={this.getMoreResults}
            bottomOffset="-600px"
            scrollableAncestor={window}
          />
        )}
        {result.isLoading && (
          <SectionLoading/>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {location, context = {}, prefix, query} = ownProps;

  // We normally only want Things, not Intervals (relations between things).
  const contextWithDefaults = {
    'filter:schemata': context['filter:schemata'] || 'Thing',
    'limit': 50,
    ...context,
  };
  const searchQuery = query !== undefined ? query : Query.fromLocation('search', location, contextWithDefaults, prefix);
  return {
    query: searchQuery,
    result: selectEntitiesResult(state, searchQuery)
  };
};

EntitySearch = connect(mapStateToProps, {queryEntities})(EntitySearch);
EntitySearch = withRouter(EntitySearch);
EntitySearch = injectIntl(EntitySearch);
export default EntitySearch;
