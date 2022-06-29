{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Divider } from '@blueprintjs/core';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { EdgeCreateDialog, TableEditor } from '@alephdata/react-ftm';

import withRouter from 'app/withRouter'
import entityEditorWrapper from 'components/Entity/entityEditorWrapper';
import { Count, ErrorSection, QueryInfiniteLoad } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import DocumentSelectDialog from 'dialogs/DocumentSelectDialog/DocumentSelectDialog';
import EntityActionBar from 'components/Entity/EntityActionBar';
import EntityDeleteButton from 'components/Toolbar/EntityDeleteButton';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';
import { showErrorToast, showSuccessToast } from 'app/toast';
import getEntityLink from 'util/getEntityLink';

import './EntityTable.scss';


const messages = defineMessages({
  search_placeholder: {
    id: 'entity.manager.search_placeholder',
    defaultMessage: 'Search {schema}',
  },
  empty: {
    id: 'entity.manager.search_empty',
    defaultMessage: 'No matching {schema} results found',
  },
  edge_create_success: {
    id: 'entity.manager.edge_create_success',
    defaultMessage: 'Successfully linked {source} and {target}',
  },
  add_to_success: {
    id: 'entity.manager.entity_set_add_success',
    defaultMessage: 'Successfully added {count} {count, plural, one {entity} other {entities}} to {entitySet}',
  },
  bulk_import: {
    id: 'entity.viewer.bulk_import',
    defaultMessage: 'Bulk import',
  },
  add_link: {
    id: 'entity.viewer.add_link',
    defaultMessage: 'Create link',
  },
  add_to: {
    id: 'entity.viewer.add_to',
    defaultMessage: 'Add to...',
  },
});

export class EntityTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
    };
    this.updateQuery = this.updateQuery.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.onSortColumn = this.onSortColumn.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onEdgeCreate = this.onEdgeCreate.bind(this);
    this.onDocSelected = this.onDocSelected.bind(this);
    this.getEntity = this.getEntity.bind(this);
    this.clearSelection = this.clearSelection.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.schema !== this.props.schema) {
      this.clearSelection();
    }
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  updateQuery(newQuery) {
    const { navigate, location } = this.props;
    navigate({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  updateSelection(entityIds, newVal) {
    this.setState(({ selection }) => {
      let newSelection;
      if (newVal) {
        newSelection = [...new Set([...selection, ...entityIds])];
      } else {
        newSelection = selection.filter(id => entityIds.indexOf(id) < 0);
      }
      return ({ selection: newSelection });
    });
  }

  onEntityClick = (entity) => {
    if (entity) {
      const { navigate } = this.props;
      navigate(getEntityLink(entity));
    }
  }

  onSortColumn(newField) {
    const { query, sort } = this.props;
    const { field: currentField, direction } = sort;

    if (currentField !== newField) {
      return this.updateQuery(query.sortBy(`properties.${newField}`, 'asc'));
    }

    // Toggle through sorting states: ascending, descending, or unsorted.
    this.updateQuery(query.sortBy(
      `properties.${currentField}`,
      direction === 'asc' ? 'desc' : undefined
    ));
  }

  onSearchSubmit(queryText) {
    const { query } = this.props;
    const newQuery = query.set('q', queryText);
    this.updateQuery(newQuery);
  }

  async onEdgeCreate(source, target, type) {
    const { entityManager, intl } = this.props;
    if (!source || !target || !type) {
      return;
    }

    try {
      if (type.property) {
        source.setProperty(type.property, target.id);
        entityManager.updateEntity(source);
      } else if (type.schema?.edge) {
        await entityManager.createEntity({
          schema: type.schema,
          properties: {
            [type.schema.edge.source]: source.id,
            [type.schema.edge.target]: target.id,
          }
        });
      }
      showSuccessToast(
        intl.formatMessage(messages.edge_create_success, { source: source.getCaption(), target: target.getCaption() })
      );
      this.setState({ selection: [] });
    } catch (e) {
      showErrorToast(e);
    }
  }

  onDocSelected(table) {
    if (!table?.id) return;
    const { navigate, schema } = this.props;
    const pathname = getEntityLink(table);
    navigate({ pathname, hash: queryString.stringify({ mode: 'mapping', schema: schema.name }) });
  }

  clearSelection() {
    this.setState({ selection: [] });
  }

  getEntity(entityId) {
    return this.props.result.results.find(({ id }) => entityId === id);
  }

  render() {
    const { collection, entityManager, query, intl, result, schema, isEntitySet, sort, updateStatus, writeable } = this.props;
    const { selection } = this.state;
    const visitEntity = schema.isThing() ? this.onEntityClick : undefined;
    const showEmptyComponent = result.total === 0 && query.hasQuery();
    const selectedEntities = selection.map(this.getEntity).filter(e => e !== undefined);

    return (
      <div className="EntityTable">
        <EntityActionBar
          query={query}
          writeable={writeable}
          onSearchSubmit={this.onSearchSubmit}
          updateStatus={updateStatus}
          searchPlaceholder={intl.formatMessage(messages.search_placeholder, { schema: schema.plural.toLowerCase() })}
          searchDisabled={result.total === 0 && !query.hasQuery()}
        >
          {!isEntitySet && (
            <>
              <DialogToggleButton
                buttonProps={{
                  text: intl.formatMessage(messages.bulk_import),
                  icon: "import"
                }}
                Dialog={DocumentSelectDialog}
                dialogProps={{
                  schema,
                  collection,
                  onSelect: this.onDocSelected
                }}
              />
              <Divider />
            </>
          )}
          {!schema.isEdge && (
            <DialogToggleButton
              buttonProps={{
                text: intl.formatMessage(messages.add_link),
                icon: "new-link",
                disabled: selection.length < 1 || selection.length > 2
              }}
              Dialog={EdgeCreateDialog}
              dialogProps={{
                source: selection.length ? selectedEntities[0] : undefined,
                target: selection.length > 1 ? selectedEntities[1] : undefined,
                onSubmit: this.onEdgeCreate,
                entityManager,
                fetchEntitySuggestions: (queryText, schemata) => entityManager.getEntitySuggestions(false, queryText, schemata),
                intl
              }}
            />
          )}
          <DialogToggleButton
            buttonProps={{
              text: intl.formatMessage(messages.add_to),
              icon: "add-to-artifact",
              disabled: selection.length < 1,
              rightIcon: <Count count={selection.length || null} />
            }}
            Dialog={EntitySetSelector}
            dialogProps={{
              collection,
              entities: selectedEntities,
              onSuccess: this.clearSelection,
              showTimelines: schema.isA('Interval')
            }}
          />
          <EntityDeleteButton
            entities={selectedEntities}
            onSuccess={this.clearSelection}
            actionType={isEntitySet ? "remove" : "delete"}
            deleteEntity={entityManager.overload.deleteEntity}
            showCount
          />
        </EntityActionBar>
        <div className="EntityTable__content">
          {showEmptyComponent && (
            <ErrorSection
              icon="search"
              title={intl.formatMessage(messages.empty, { schema: schema.plural.toLowerCase() })}
            />
          )}
          {!showEmptyComponent && (
            <>
              <TableEditor
                key={schema.name}
                entities={result.results}
                schema={schema}
                entityManager={entityManager}
                fetchEntitySuggestions={(queryText, schemata) => entityManager.getEntitySuggestions(false, queryText, schemata)}
                sort={sort}
                sortColumn={this.onSortColumn}
                selection={selection}
                updateSelection={this.updateSelection}
                writeable={writeable}
                isPending={result.total === undefined}
                visitEntity={visitEntity}
              />
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
)(EntityTable);
