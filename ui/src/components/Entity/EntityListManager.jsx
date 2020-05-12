import React, { Component } from 'react';
import { Button } from '@blueprintjs/core';
import { Waypoint } from 'react-waypoint';
import _ from 'lodash';
import { injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { TableEditor } from '@alephdata/vislib';

import entityEditorWrapper from 'src/components/Entity/entityEditorWrapper';
import EntityDeleteDialog from 'src/dialogs/EntityDeleteDialog/EntityDeleteDialog';
import { Count } from 'src/components/common';
import { queryEntities } from 'src/actions';
import { queryCollectionEntities } from 'src/queries';
import { selectEntitiesResult } from 'src/selectors';
import getEntityLink from 'src/util/getEntityLink';

import './EntityListManager.scss';

export class EntityListManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      deleteIsOpen: false,
    };
    this.updateQuery = this.updateQuery.bind(this);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleDeleteSelection = this.toggleDeleteSelection.bind(this);
    this.onSortColumn = this.onSortColumn.bind(this);
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

  render() {
    const { collection, schema, entityManager, result, sort } = this.props;
    const { selection } = this.state;

    return (
      <div className="EntityListManager">
        { collection.writeable && (
          <div className="bp3-button-group">
            <Button icon="trash" onClick={this.toggleDeleteSelection} disabled={!selection.length}>
              <span className="align-middle">
                <FormattedMessage id="entity.viewer.delete" defaultMessage="Delete" />
              </span>
              <Count count={selection.length} />
            </Button>
          </div>
        )}
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
            visitEntity={this.onEntityClick}
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
  // if (collection.writeable) {
  //   query = query.set('cache', 'false');
  // }
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
