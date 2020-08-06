import React, { Component } from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, Divider } from '@blueprintjs/core';
import { Waypoint } from 'react-waypoint';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { EdgeCreateDialog, TableEditor } from '@alephdata/react-ftm';

import entityEditorWrapper from 'components/Entity/entityEditorWrapper';
import { Count, ErrorSection } from 'components/common';
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
});

export class EntityTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      docSelectIsOpen: false,
      edgeCreateIsOpen: false,
      addToIsOpen: false,
    };
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.onSortColumn = this.onSortColumn.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onEdgeCreate = this.onEdgeCreate.bind(this);
    this.onDocSelected = this.onDocSelected.bind(this);
    this.toggleDocumentSelectDialog = this.toggleDocumentSelectDialog.bind(this);
    this.toggleEdgeCreateDialog = this.toggleEdgeCreateDialog.bind(this);
    this.toggleEntitySetSelector = this.toggleEntitySetSelector.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    if (result.next && !result.isPending && !result.isError) {
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
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  updateSelection(entity) {
    const { selection } = this.state;
    this.setState({
      selection: _.xorBy(selection, [entity], 'id'),
    });
  }

  onEntityClick = (entity) => {
    if (entity) {
      const { history } = this.props;
      const pathname = getEntityLink(entity);
      history.push({ pathname });
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
      this.toggleEdgeCreateDialog();
    } catch (e) {
      showErrorToast(e);
    }
  }

  onDocSelected(table) {
    if (!table?.id) return;
    const { history, schema } = this.props;
    const pathname = getEntityLink(table);
    history.push({ pathname, hash: queryString.stringify({ mode: 'mapping', schema: schema.name }) });
  }

  toggleDocumentSelectDialog() {
    this.setState(({ docSelectIsOpen }) => ({
      docSelectIsOpen: !docSelectIsOpen,
    }));
  }

  toggleEdgeCreateDialog() {
    this.setState(({ edgeCreateIsOpen }) => ({
      edgeCreateIsOpen: !edgeCreateIsOpen,
    }));
  }

  toggleEntitySetSelector(isSuccess) {
    this.setState(({ addToIsOpen, selection }) => ({
      selection: isSuccess ? [] : selection,
      addToIsOpen: !addToIsOpen,
    }));
  }

  render() {
    const { collection, entityManager, query, intl, result, schema, isEntitySet, sort, writeable } = this.props;
    const { selection } = this.state;
    const visitEntity = schema.isThing() ? this.onEntityClick : undefined;
    const showEmptyComponent = result.total === 0 && query.hasQuery();


    return (
      <div className="EntityTable">
        <EntityActionBar
          query={query}
          writeable={writeable}
          onSearchSubmit={this.onSearchSubmit}
          searchPlaceholder={intl.formatMessage(messages.search_placeholder, { schema: schema.plural.toLowerCase() })}
          searchDisabled={result.total === 0 && !query.hasQuery()}
        >
          {!isEntitySet && (
            <>
              <Button icon="import" onClick={this.toggleDocumentSelectDialog}>
                <FormattedMessage id="entity.viewer.bulk_import" defaultMessage="Bulk import" />
              </Button>
              <Divider />
            </>
          )}
          {!schema.isEdge && (
            <Button icon="new-link" onClick={this.toggleEdgeCreateDialog} disabled={selection.length < 1 || selection.length > 2}>
              <FormattedMessage id="entity.viewer.add_link" defaultMessage="Create link" />
            </Button>
          )}
          <Button icon="add-to-artifact" onClick={() => this.toggleEntitySetSelector()} disabled={selection.length < 1}>
            <FormattedMessage id="entity.viewer.add_to" defaultMessage="Add to..." />
            <Count count={selection.length || null} />
          </Button>
          <EntityDeleteButton
            entities={selection}
            onSuccess={() => this.setState({ selection: [] })}
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
                entities={result.results}
                schema={schema}
                entityManager={entityManager}
                sort={sort}
                sortColumn={this.onSortColumn}
                selection={selection}
                updateSelection={this.updateSelection}
                writeable={writeable}
                isPending={result.isPending}
                visitEntity={visitEntity}
              />
              <Waypoint
                onEnter={this.getMoreResults}
                bottomOffset="-600px"
                scrollableAncestor={window}
              />
            </>
          )}
        </div>
        <DocumentSelectDialog
          schema={schema}
          collection={collection}
          isOpen={this.state.docSelectIsOpen}
          toggleDialog={this.toggleDocumentSelectDialog}
          onSelect={this.onDocSelected}
        />
        <EdgeCreateDialog
          source={selection.length ? selection[0] : undefined}
          target={selection.length > 1 ? selection[1] : undefined}
          isOpen={this.state.edgeCreateIsOpen}
          toggleDialog={this.toggleEdgeCreateDialog}
          onSubmit={this.onEdgeCreate}
          model={entityManager.model}
          getEntitySuggestions={entityManager.getEntitySuggestions}
          intl={intl}
        />
        <EntitySetSelector
          collection={collection}
          entities={selection}
          isOpen={this.state.addToIsOpen}
          toggleDialog={this.toggleEntitySetSelector}
        />
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
