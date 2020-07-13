import React, { Component } from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, Divider } from '@blueprintjs/core';
import { Waypoint } from 'react-waypoint';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { TableEditor } from '@alephdata/react-ftm';

import entityEditorWrapper from 'src/components/Entity/entityEditorWrapper';
import { Count, ErrorSection } from 'src/components/common';
import AddToDiagramDialog from 'src/dialogs/AddToDiagramDialog/AddToDiagramDialog';
import DocumentSelectDialog from 'src/dialogs/DocumentSelectDialog/DocumentSelectDialog';
import EntityActionBar from 'src/components/Entity/EntityActionBar';
import { queryEntities } from 'src/actions';
import { queryCollectionEntities } from 'src/queries';
import { selectEntitiesResult } from 'src/selectors';
import getEntityLink from 'src/util/getEntityLink';

import './EntityListManager.scss';


const messages = defineMessages({
  search_placeholder: {
    id: 'entity.manager.search_placeholder',
    defaultMessage: 'Search {schema}',
  },
  empty: {
    id: 'entity.manager.search_empty',
    defaultMessage: 'No matching {schema} results found',
  },
});

export class EntityListManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      docSelectIsOpen: false,
      addToDiagramIsOpen: false,
    };
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.onSortColumn = this.onSortColumn.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onDocSelected = this.onDocSelected.bind(this);
    this.toggleDocumentSelectDialog = this.toggleDocumentSelectDialog.bind(this);
    this.toggleAddToDiagramDialog = this.toggleAddToDiagramDialog.bind(this);
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

  onDocSelected(table) {
    if (!table?.id) return;
    const { history, schema } = this.props;
    const pathname = getEntityLink(table);
    history.push({ pathname, hash: queryString.stringify({mode: 'mapping', schema: schema.name}) });
  }

  toggleDocumentSelectDialog() {
    this.setState(({ docSelectIsOpen }) => ({
      docSelectIsOpen: !docSelectIsOpen,
    }));
  }

  toggleAddToDiagramDialog() {
    this.setState(({ addToDiagramIsOpen }) => ({
      addToDiagramIsOpen: !addToDiagramIsOpen,
    }));
  }

  render() {
    const { collection, entityManager, query, intl, result, schema, sort } = this.props;
    const { selection } = this.state;
    const visitEntity = schema.isThing() ? this.onEntityClick : undefined;
    const showEmptyComponent = result.total === 0 && query.hasQuery();

    return (
      <div className="EntityListManager">
        <EntityActionBar
          query={query}
          writeable={collection.writeable}
          selection={selection}
          resetSelection={() => this.setState({ selection: []})}
          onSearchSubmit={this.onSearchSubmit}
          searchPlaceholder={intl.formatMessage(messages.search_placeholder, { schema: schema.plural.toLowerCase() })}
          searchDisabled={result.total === 0 && !query.hasQuery()}
        >
          <Button icon="import" onClick={this.toggleDocumentSelectDialog}>
            <FormattedMessage id="entity.viewer.bulk_import" defaultMessage="Bulk import" />
          </Button>
          <Divider />
          {!schema.isEdge && (
            <Button icon="send-to-graph" onClick={this.toggleAddToDiagramDialog} disabled={selection.length < 1}>
              <FormattedMessage id="entity.viewer.add_to_diagram" defaultMessage="Add to diagram" />
              <Count count={selection.length || null} />
            </Button>
          )}
        </EntityActionBar>
        <div className="EntityListManager__content">
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
                writeable={collection.writeable}
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
        <AddToDiagramDialog
          collection={collection}
          entities={selection}
          isOpen={this.state.addToDiagramIsOpen}
          toggleDialog={this.toggleAddToDiagramDialog}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, collection, schema } = ownProps;
  const query = queryCollectionEntities(location, collection.id, schema.name);
  const sort = query.getSort();

  return {
    query,
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
)(EntityListManager);
