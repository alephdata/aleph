import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

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

import './Timeline.scss';

const defaultFacets = [
  'names', 'addresses', 'schema',
];

const messages = defineMessages({
  empty: {
    id: 'timeline.empty',
    defaultMessage: 'This timeline is empty',
  },
  histogram_empty: {
    id: 'timeline.empty_histogram',
    defaultMessage: 'No dates found for selected range',
  }
});

class TimelineItemList extends Component {
  constructor(props) {
    super(props);
    this.createNewItem = this.createNewItem.bind(this);
  }

  async createNewItem({ schema, properties }) {
    const { entityManager, onHideDraft } = this.props;

    const simplifiedProps = {};
    properties.forEach((value, prop) => {
      simplifiedProps[prop.name] = value
    })

    await entityManager.createEntity({ schema, properties: simplifiedProps });
    onHideDraft()
  }

  render() {
    const { deleteEntity, entityManager, query, intl, result, showDraftItem, onHideDraft } = this.props;

    const items = result.results;
    const isEmpty = items.length === 0;

    if (isEmpty && !result.isPending && !showDraftItem) {
      return (
        <ErrorSection
          icon="gantt-chart"
          title={intl.formatMessage(messages.empty)}
        />
      )
    }

    return (
      <div className="Timeline__content">
        {showDraftItem && (
          <TimelineItem
            isDraft
            onUpdate={this.createNewItem}
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
