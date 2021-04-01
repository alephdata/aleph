import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { DualPane, ErrorSection, QueryInfiniteLoad } from 'components/common';
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
  // search_placeholder: {
  //   id: 'entity.manager.search_placeholder',
  //   defaultMessage: 'Search {schema}',
  // },
  empty: {
    id: 'timeline.empty',
    defaultMessage: 'This timeline is empty',
  },
  histogram_empty: {
    id: 'timeline.empty_histogram',
    defaultMessage: 'No dates found for selected range',
  }
});

class Timeline extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      showNewItem: false
    };
    this.updateQuery = this.updateQuery.bind(this);
    this.createNewItem = this.createNewItem.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  async createNewItem({ schema, properties }) {
    const { entityManager } = this.props;

    const simplifiedProps = {};
    properties.forEach((value, prop) => {
      simplifiedProps[prop.name] = value
    })

    await entityManager.createEntity({ schema, properties: simplifiedProps });
    this.setState({ showNewItem: false });
  }

  clearSelection() {
    this.setState({ selection: [] });
  }

  render() {
    const { deleteEntity, entityManager, query, intl, result } = this.props;
    const { showNewItem } = this.state;

    const items = result.results;
    const isEmpty = items.length === 0;

    return (
      <DualPane className="Timeline">
        <DualPane.SidePane>
          <DateFacet
            isOpen={true}
            intervals={result.facets?.dates?.intervals}
            query={query}
            updateQuery={this.updateQuery}
            emptyText={intl.formatMessage(messages.histogram_empty)}
          />
          <SearchFacets
            query={query}
            result={result}
            updateQuery={this.updateQuery}
            facets={defaultFacets}
          />
        </DualPane.SidePane>
        <DualPane.ContentPane>
          <QueryTags query={query} updateQuery={this.updateQuery} />
          <SearchActionBar result={result}>
            <SortingBar
              query={query}
              updateQuery={this.updateQuery}
              sortingFields={['properties.date', 'caption', 'created_at']}
            />
          </SearchActionBar>
          <TimelineActionBar createNewItem={() => this.setState({ showNewItem: true })} />
          <div className="Timeline__content">
            {isEmpty && !showNewItem && (
              <ErrorSection
                icon="gantt-chart"
                title={intl.formatMessage(messages.empty)}
              />
            )}
            {showNewItem && (
              <TimelineItem
                isDraft
                onUpdate={this.createNewItem}
                onDelete={() => this.setState({ showNewItem: false })}
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
                <QueryInfiniteLoad
                  query={query}
                  result={result}
                  fetch={this.props.queryEntities}
                />
              </>
            )}
          </div>
        </DualPane.ContentPane>
      </DualPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;

  return {
    result: selectEntitiesResult(state, query)
  };
};

export default compose(
  withRouter,
  entityEditorWrapper,
  connect(mapStateToProps, { deleteEntity, queryEntities }),
  injectIntl,
)(Timeline);
