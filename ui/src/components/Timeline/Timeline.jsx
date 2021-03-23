import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Divider } from '@blueprintjs/core';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { EdgeCreateDialog, TableEditor } from '@alephdata/react-ftm';

import { DualPane, ErrorSection, HotKeysContainer, QueryInfiniteLoad } from 'components/common';
import SearchFacets from 'components/Facet/SearchFacets';
import entityEditorWrapper from 'components/Entity/entityEditorWrapper';
import { DialogToggleButton } from 'components/Toolbar';
import TimelineActionBar from 'components/Timeline/TimelineActionBar';
import TimelineItem from 'components/Timeline/TimelineItem';
import DateFacet from 'components/Facet/DateFacet';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';

import './Timeline.scss';

const defaultFacets = [
  'schema', 'countries', 'names', 'addresses',
];

const messages = defineMessages({
  // search_placeholder: {
  //   id: 'entity.manager.search_placeholder',
  //   defaultMessage: 'Search {schema}',
  // },
  empty: {
    id: 'timeline.empty',
    defaultMessage: 'This timeline is empty',
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

  createNewItem() {
    this.setState({ showNewItem: true });
  }

  // updateSelection(entityIds, newVal) {
  //   this.setState(({ selection }) => {
  //     let newSelection;
  //     if (newVal) {
  //       newSelection = [...new Set([...selection, ...entityIds])];
  //     } else {
  //       newSelection = selection.filter(id => entityIds.indexOf(id) < 0);
  //     }
  //     return ({ selection: newSelection });
  //   });
  // }

  // onEntityClick = (entity) => {
  //   if (entity) {
  //     const { history } = this.props;
  //     history.push(getEntityLink(entity));
  //   }
  // }
  //
  // onSortColumn(newField) {
  //   const { query, sort } = this.props;
  //   const { field: currentField, direction } = sort;
  //
  //   if (currentField !== newField) {
  //     return this.updateQuery(query.sortBy(`properties.${newField}`, 'asc'));
  //   }
  //
  //   // Toggle through sorting states: ascending, descending, or unsorted.
  //   this.updateQuery(query.sortBy(
  //     `properties.${currentField}`,
  //     direction === 'asc' ? 'desc' : undefined
  //   ));
  // }
  //
  // onSearchSubmit(queryText) {
  //   const { query } = this.props;
  //   const newQuery = query.set('q', queryText);
  //   this.updateQuery(newQuery);
  // }

  clearSelection() {
    this.setState({ selection: [] });
  }

  render() {
    const { collection, entityManager, query, intl, result, schema, isEntitySet, sort, updateStatus, writeable } = this.props;
    const { showNewItem } = this.state;

    const items = result.results;
    const isEmpty = items.length == 0;
    // const selectedEntities = selection.map(this.getEntity).filter(e => e !== undefined);

    return (
      <DualPane className="Timeline">
        <DualPane.SidePane>
          <SearchFacets
            query={query}
            result={result}
            updateQuery={this.updateQuery}
            facets={defaultFacets}
            isCollapsible
          />
        </DualPane.SidePane>
        <DualPane.ContentPane>
          <DateFacet
            isOpen={true}
            intervals={result.facets?.dates?.intervals}
            query={query}
            updateQuery={this.updateQuery}
          />
          <TimelineActionBar createNewItem={this.createNewItem} />
          <div className="Timeline__content">
            {isEmpty && !showNewItem && (
              <ErrorSection
                icon="gantt-chart"
                title={intl.formatMessage(messages.empty)}
              />
            )}
            {showNewItem && <TimelineItem />}
            {!isEmpty && (
              <>
                {items.map((item) => (
                  <TimelineItem key={item.id} entity={item} />
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
  const sort = query.getSort();


  return {
    sort: !_.isEmpty(sort) ? {
      field: sort.field.replace('properties.', ''),
      direction: sort.direction
    } : {},
    result: selectEntitiesResult(state, query)
  };
};

export default compose(
  withRouter,
  entityEditorWrapper,
  connect(mapStateToProps, { queryEntities }),
  injectIntl,
)(Timeline);
