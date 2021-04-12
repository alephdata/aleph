import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { DualPane, ErrorSection, QueryInfiniteLoad, SectionLoading } from 'components/common';
import SearchFacets from 'components/Facet/SearchFacets';
import SearchActionBar from 'components/common/SearchActionBar';
import entityEditorWrapper from 'components/Entity/entityEditorWrapper';
import TimelineActionBar from 'components/Timeline/TimelineActionBar';
import TimelineItem from 'components/Timeline/TimelineItem';
import DateFacet from 'components/Facet/DateFacet';
import QueryTags from 'components/QueryTags/QueryTags';
import SortingBar from 'components/SortingBar/SortingBar';

import { deleteEntity, queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';

const defaultFacets = [
  'names', 'addresses', 'schema',
];

const messages = defineMessages({
  empty: {
    id: 'timeline.empty',
    defaultMessage: 'This timeline is empty',
  },
  no_results: {
    id: 'timeline.no_results',
    defaultMessage: 'No items found matching query',
  },
  histogram_empty: {
    id: 'timeline.empty_histogram',
    defaultMessage: 'No dates found for selected range',
  }
});

class TimelineItemList extends Component {
  constructor(props) {
    super(props);

    this.state = { draftEntity: null };

    this.createNewItem = this.createNewItem.bind(this);
  }

  async createNewItem() {
    const { entityManager, history, location, onHideDraft } = this.props;
    const { schema, properties } = this.state.draftEntity;

    const simplifiedProps = {};
    properties.forEach((value, prop) => {
      simplifiedProps[prop.name] = value
    })

    const entity = await entityManager.createEntity({ schema, properties: simplifiedProps });
    onHideDraft();
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify({ id: entity.id })
    })
  }

  render() {
    const { entitiesCount, deleteEntity, entityManager, query, intl, result, showDraftItem, onHideDraft } = this.props;

    const items = result.results;
    const isEmpty = items.length === 0;

    if (isEmpty && !result.isPending && !showDraftItem) {
      return (
        <ErrorSection
          icon="gantt-chart"
          title={intl.formatMessage(messages[entitiesCount === 0 ? 'empty' : 'no_results'])}
        />
      );
    }

    return (
      <div className="Timeline__content">
        {showDraftItem && (
          <TimelineItem
            isDraft
            onUpdate={entity => this.setState({ draftEntity: entity })}
            onSubmit={this.createNewItem}
            onDelete={onHideDraft}
            fetchEntitySuggestions={(queryText, schemata) => entityManager.getEntitySuggestions(false, queryText, schemata)}
          />
        )}
        {!isEmpty && (
          <>
            {items.map((item) => (
              <TimelineItem
                key={item.id}
                entity={item}
                onUpdate={entityData => entityManager.updateEntity(entityData)}
                onRemove={entityId => entityManager.deleteEntities([entityId])}
                onDelete={entityId => deleteEntity(entityId)}
                fetchEntitySuggestions={(queryText, schemata) => entityManager.getEntitySuggestions(false, queryText, schemata)}
              />
            ))}
          </>
        )}
        {result.isPending && (
          <SectionLoading />
        )}
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={this.props.queryEntities}
        />
      </div>
    );
  }
}

export default compose(
  withRouter,
  connect(null, { deleteEntity, queryEntities }),
  injectIntl,
)(TimelineItemList );
