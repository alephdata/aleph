import React, { Component } from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, ControlGroup, InputGroup } from '@blueprintjs/core';
import { Waypoint } from 'react-waypoint';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { TableEditor } from '@alephdata/react-ftm';

import entityEditorWrapper from 'src/components/Entity/entityEditorWrapper';
import EntityDeleteDialog from 'src/dialogs/EntityDeleteDialog/EntityDeleteDialog';
import { Count } from 'src/components/common';
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
});

export class EntityListManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      deleteIsOpen: false,
      queryText: '',
    };
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleDeleteSelection = this.toggleDeleteSelection.bind(this);
    this.onSortColumn = this.onSortColumn.bind(this);
    this.onQueryTextChange = this.onQueryTextChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextQueryText = nextProps.query ? nextProps.query.getString('q') : prevState.queryText;
    const queryChanged = !prevState?.prevQuery || prevState.prevQuery.getString('q') !== nextQueryText;
    return {
      prevQuery: nextProps.query,
      queryText: queryChanged ? nextQueryText : prevState.queryText,
    };
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

  toggleDeleteSelection() {
    const { deleteIsOpen } = this.state;
    if (deleteIsOpen) {
      this.setState({ selection: [] });
    }
    this.setState(({ deleteIsOpen: !deleteIsOpen }));
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

  onQueryTextChange({ target }) {
    const queryText = target.value;
    this.setState({ queryText });
  }

  onSearchSubmit(e) {
    e.preventDefault();
    const { history, query, location } = this.props;
    const { queryText } = this.state;
    const newQuery = query.set('q', queryText);
    this.updateQuery(newQuery);
  }

  render() {
    const { collection, entityManager, intl, result, schema, sort } = this.props;
    const { queryText, selection } = this.state;
    const visitEntity = schema.isThing() ? this.onEntityClick : undefined;

    return (
      <div className="EntityListManager">
        <ControlGroup className="EntityListManager__actions">
          { collection.writeable && (
            <ButtonGroup>
              <Button icon="trash" onClick={this.toggleDeleteSelection} disabled={!selection.length}>
                <span className="align-middle">
                  <FormattedMessage id="entity.viewer.delete" defaultMessage="Delete" />
                </span>
                <Count count={selection.length} />
              </Button>
            </ButtonGroup>
          )}
          <form onSubmit={this.onSearchSubmit}>
            <InputGroup
              fill
              leftIcon="search"
              onChange={this.onQueryTextChange}
              placeholder={intl.formatMessage(messages.search_placeholder, { schema: schema.plural })}
              value={queryText}
            />
          </form>
        </ControlGroup>
        <div className="EntityListManager__content">
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
        </div>
        <EntityDeleteDialog
          entities={selection}
          isOpen={this.state.deleteIsOpen}
          toggleDialog={this.toggleDeleteSelection}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, collection, schema } = ownProps;
  let query = queryCollectionEntities(location, collection.id, schema.name);
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
