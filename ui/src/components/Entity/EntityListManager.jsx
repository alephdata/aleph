import React, { Component } from 'react';
import { Button } from '@blueprintjs/core';
import _ from 'lodash';
import { injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import EntityDeleteDialog from 'src/dialogs/EntityDeleteDialog/EntityDeleteDialog';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';
import { Count } from 'src/components/common';
import { queryEntities } from 'src/actions';

import './EntityListManager.scss';

export class EntityListManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      deleteIsOpen: false,
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleDeleteSelection = this.toggleDeleteSelection.bind(this);
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

  render() {
    const { collection, query } = this.props;
    const { selection } = this.state;
    const writeable = collection !== undefined && collection.writeable;

    return (
      <div className="EntityListManager">
        { writeable && (
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
          <EntitySearch
            collection={collection}
            query={query}
            hideCollection
            documentMode
            showPreview={false}
            selection={selection}
            updateSelection={this.updateSelection}
            showTableEditor
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
)(EntityListManager);
