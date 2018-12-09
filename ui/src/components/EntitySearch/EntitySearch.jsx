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
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { query, result, queryEntities } = this.props;
    if (result.shouldLoad) {
      queryEntities({ query });
    }
  }

  getMoreResults() {
    const {query, result, queryEntities} = this.props;
    if (result && result.next && !result.isLoading && !result.isError) {
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

  render() {
    const { query, result, intl, className } = this.props;
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
                     result={result}
                     documentMode={this.props.documentMode}
                     hideCollection={this.props.hideCollection}
                     showPreview={this.props.showPreview}
                     updateQuery={this.updateQuery}
                     updateSelection={this.props.updateSelection}
                     selection={this.props.selection} />
        <Waypoint onEnter={this.getMoreResults}
                  bottomOffset="-300px"
                  scrollableAncestor={window} />
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
  const searchQuery = query !== undefined ? query : Query.fromLocation('entities', location, contextWithDefaults, prefix);
  return {
    query: searchQuery,
    result: selectEntitiesResult(state, searchQuery)
  };
};

EntitySearch = connect(mapStateToProps, {queryEntities})(EntitySearch);
EntitySearch = withRouter(EntitySearch);
EntitySearch = injectIntl(EntitySearch);
export default EntitySearch;
