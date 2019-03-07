import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';
import { defineMessages } from 'react-intl';

import Query from 'src/app/Query';
import { queryEntities as queryEntitiesAction } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import EntityTable from 'src/components/EntityTable/EntityTable';
import { SectionLoading, ErrorSection } from 'src/components/common';
import { enhancer } from 'src/util/enhancers';

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
  },
});


const mapStateToProps = (state, ownProps) => {
  const {
    location, context = {}, prefix, query,
  } = ownProps;

  // We normally only want Things, not Intervals (relations between things).
  const contextWithDefaults = {
    'filter:schemata': context['filter:schemata'] || 'Thing',
    ...context,
  };
  const searchQuery = query !== undefined ? query : Query.fromLocation('entities', location, contextWithDefaults, prefix);
  return {
    query: searchQuery,
    result: selectEntitiesResult(state, searchQuery),
  };
};

export class EntitySearch extends Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result, queryEntities } = this.props;
    if (result && result.next && !result.isLoading && !result.isError) {
      queryEntities({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { query, result, queryEntities } = this.props;
    if (result.shouldLoad) {
      queryEntities({ query });
    }
  }

  updateQuery(newQuery) {
    const { updateQuery } = this.props;
    if (updateQuery !== undefined) {
      return updateQuery(newQuery);
    }
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
    return undefined;
  }

  render() {
    const {
      query, result, intl, className,
      documentMode, hideCollection,
      showPreview, updateSelection, selection,
    } = this.props;
    const isEmpty = !query.hasQuery();

    return (
      <div className={className}>
        {result.total === 0 && (
          <section className="PartialError">
            { !isEmpty && (
              <ErrorSection
                visual="search"
                title={intl.formatMessage(messages.no_results_title)}
                description={intl.formatMessage(messages.no_results_description)}
              />
            )}
            { isEmpty && (
              <ErrorSection
                visual="folder-open"
                title={intl.formatMessage(messages.empty_title)}
              />
            )}
          </section>
        )}
        <EntityTable
          query={query}
          result={result}
          documentMode={documentMode}
          hideCollection={hideCollection}
          showPreview={showPreview}
          updateQuery={this.updateQuery}
          updateSelection={updateSelection}
          selection={selection}
        />
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
        {result.isLoading && (
          <SectionLoading />
        )}
      </div>
    );
  }
}
export default enhancer({
  mapStateToProps,
  mapDispatchToProps: { queryEntities: queryEntitiesAction },
})(EntitySearch);
