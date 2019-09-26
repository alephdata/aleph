import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Callout } from '@blueprintjs/core';
import c from 'classnames';

import Query from 'src/app/Query';
import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import EntityTable from 'src/components/EntityTable/EntityTable';
import { SectionLoading, ErrorSection } from 'src/components/common';

import './EntitySearch.scss';

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
    const { query, result } = this.props;
    if (result && result.next && !result.isLoading && !result.isError) {
      this.props.queryEntities({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntities({ query });
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

  generateFoundText() {
    const { result, foundTextGenerator } = this.props;

    if (!foundTextGenerator || result.isLoading || result.total === 0
      || !result.facets || !result.facets.collection_id) {
      return null;
    }

    const text = foundTextGenerator({
      resultCount: result.total,
      datasetCount: result.facets.collection_id.total,
    });

    return <Callout icon={null} intent="primary" className="EntitySearch__foundText">{text}</Callout>;
  }

  render() {
    const {
      query, result, intl, className,
      documentMode, hideCollection,
      showPreview, updateSelection, selection,
      emptyComponent,
    } = this.props;
    const isEmpty = !query.hasQuery();
    const foundText = this.generateFoundText();

    return (
      <div className={c('EntitySearch', className)}>
        {result.total === 0 && (
          <section className="PartialError">
            { !isEmpty && (
              <ErrorSection
                icon="search"
                title={intl.formatMessage(messages.no_results_title)}
                description={intl.formatMessage(messages.no_results_description)}
              />
            )}
            { isEmpty && emptyComponent }
          </section>
        )}
        {foundText}
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

const mapDispatchToProps = { queryEntities };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntitySearch);
