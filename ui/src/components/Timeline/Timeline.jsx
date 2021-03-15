import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Divider } from '@blueprintjs/core';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { EdgeCreateDialog, TableEditor } from '@alephdata/react-ftm';

import entityEditorWrapper from 'components/Entity/entityEditorWrapper';
import { Count, ErrorSection, QueryInfiniteLoad } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import DocumentSelectDialog from 'dialogs/DocumentSelectDialog/DocumentSelectDialog';
import TimelineActionBar from 'components/Timeline/TimelineActionBar';
import EntityActionBar from 'components/Entity/EntityActionBar';
import EntityDeleteButton from 'components/Toolbar/EntityDeleteButton';
import TimelineItem from 'components/Timeline/TimelineItem';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';
import { showErrorToast, showSuccessToast } from 'app/toast';
import getEntityLink from 'util/getEntityLink';

import './Timeline.scss';


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
      newItem: null
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
    this.setState({ newItem: {} });
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
    const { newItem } = this.state;

    const newItems = newItem ? [newItem] : [];
    const existingItems = result.results ? result.results : [];
    const items = [...newItems, ...existingItems]

    const isEmpty = items.length == 0;
    // const selectedEntities = selection.map(this.getEntity).filter(e => e !== undefined);

    return (
      <div className="Timeline">
        <TimelineActionBar createNewItem={this.createNewItem} />
        <div className="Timeline__content">
          {isEmpty && (
            <ErrorSection
              icon="gantt-chart"
              title={intl.formatMessage(messages.empty)}
            />
          )}
          {!isEmpty && (
            <>
              {items.map((item) => (
                <TimelineItem key={item.id || 'new'} item={item} />
              ))}
              <QueryInfiniteLoad
                query={query}
                result={result}
                fetch={this.props.queryEntities}
              />
            </>
          )}
        </div>
      </div>
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
