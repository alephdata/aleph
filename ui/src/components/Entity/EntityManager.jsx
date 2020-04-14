import React, { Component } from 'react';
import { Button } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import EntityDeleteDialog from 'src/dialogs/EntityDeleteDialog/EntityDeleteDialog';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';
import { Count } from 'src/components/common';
import { queryEntities } from 'src/actions';

const messages = defineMessages({
  edit: {
    id: 'entity.viewer.edit',
    defaultMessage: 'Edit',
  },
  leave_edit: {
    id: 'entity.viewer.leaveEdit',
    defaultMessage: 'Leave edit mode',
  },
});

export class EntityManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      deleteIsOpen: false,
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleDeleteSelection = this.toggleDeleteSelection.bind(this);
    this.toggleEditMode = this.toggleEditMode.bind(this);
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

  toggleEditMode() {
    const { editMode, history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if (editMode) {
      delete parsedHash.editMode;
    } else {
      parsedHash.editMode = true;
    }

    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, editMode, query, intl,
    } = this.props;
    const { selection } = this.state;
    const writeable = collection !== undefined && collection.writeable;

    return (
      <div className="EntityManager">
        { writeable && (
          <div className="bp3-button-group">
            <Button icon={editMode ? 'log-out' : 'edit'} onClick={this.toggleEditMode}>
              <span className="align-middle">
                {intl.formatMessage(editMode ? messages.leave_edit : messages.edit)}
              </span>
            </Button>
            <Button icon="trash" onClick={this.toggleDeleteSelection} disabled={!selection.length}>
              <span className="align-middle">
                <FormattedMessage id="entity.viewer.delete" defaultMessage="Delete" />
              </span>
              <Count count={selection.length} />
            </Button>
          </div>
        )}
        <div className="EntityManager__content">
          <EntitySearch
            collection={collection}
            query={query}
            hideCollection
            documentMode
            showPreview={false}
            selection={selection}
            writeable={writeable}
            updateSelection={this.updateSelection}
            editMode={editMode}
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
  let { query } = ownProps;
  const { collection } = ownProps;
  if (!query.hasSort()) {
    query = query.sortBy('name', 'asc');
  }
  if (collection.writeable) {
    query = query.set('cache', 'false');
  }
  return { query };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
  injectIntl,
)(EntityManager);
