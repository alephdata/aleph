import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Callout } from '@blueprintjs/core';
import c from 'classnames';

import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import EntityTable from 'src/components/EntityTable/EntityTable';
import { ErrorSection } from 'src/components/common';

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
    if (result && result.next && !result.isPending && !result.isError) {
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
      hash: location.hash,
    });
    return undefined;
  }

  generateFoundText() {
    const { result, foundTextGenerator } = this.props;

    if (!foundTextGenerator || result.isPending || result.total === 0
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
      emptyComponent, collection,
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
          collection={collection}
        />
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
      </div>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const result = selectEntitiesResult(state, query);
  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
  injectIntl,
)(EntitySearch);
