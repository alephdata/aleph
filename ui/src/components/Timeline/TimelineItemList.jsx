import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import c from 'classnames';

import { ErrorSection, QueryInfiniteLoad, SectionLoading } from 'components/common';
import TimelineItem from 'components/Timeline/TimelineItem';

import { createEntity, deleteEntity, queryEntities } from 'actions';


const messages = defineMessages({
  empty: {
    id: 'timeline.empty',
    defaultMessage: 'This timeline is empty',
  },
  no_results: {
    id: 'timeline.no_results',
    defaultMessage: 'No items found matching query',
  },
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
      hash: queryString.stringify({ ...queryString.parse(location.hash), id: entity.id })
    })
  }

  createNewReferencedEntity(entity) {
    const { collection } = this.props;
    return this.props.createEntity({ entity, collection_id: collection.id });
  }

  render() {
    const { expandedMode, entitiesCount, deleteEntity, entityManager, query, intl, result, showDraftItem, onHideDraft, writeable } = this.props;

    const items = result.results;
    const isEmpty = items.length === 0;

    if (isEmpty && !result.isPending && !showDraftItem) {
      return (
        <ErrorSection
          icon="gantt-chart"
          title={intl.formatMessage(messages[entitiesCount.total === 0 ? 'empty' : 'no_results'])}
        />
      );
    }

    return (
      <div className={c("Timeline__content", { collapsed: !expandedMode})}>
        {showDraftItem && (
          <TimelineItem
            isDraft
            onUpdate={entity => this.setState({ draftEntity: entity })}
            onSubmit={this.createNewItem}
            onDelete={onHideDraft}
            fetchEntitySuggestions={(queryText, schemata) => entityManager.getEntitySuggestions(false, queryText, schemata)}
            createNewEntity={entityData => entityManager.createEntity(entityData, false)}
            writeable
            expandedMode={true}
          />
        )}
        {!isEmpty && (
          <>
            {items.map((item) => (
              <TimelineItem
                key={item.id}
                entity={item}
                expandedMode={expandedMode}
                onUpdate={entityData => entityManager.updateEntity(entityData)}
                onRemove={entityId => entityManager.deleteEntities([entityId])}
                onDelete={entityId => deleteEntity(entityId)}
                fetchEntitySuggestions={(queryText, schemata) => entityManager.getEntitySuggestions(false, queryText, schemata)}
                createNewEntity={entityData => entityManager.createEntity(entityData, false)}
                writeable={writeable && item.writeable}
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
  connect(null, { createEntity, deleteEntity, queryEntities }),
  injectIntl,
)(TimelineItemList );
