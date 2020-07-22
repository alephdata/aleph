import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Alert, Icon, Intent, Spinner } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import c from 'classnames';

import { deleteEntity } from 'actions';
import { Entity } from 'components/common';
import { showErrorToast, showSuccessToast } from 'app/toast';
import getCollectionLink from 'util/getCollectionLink';
import getEntityLink from 'util/getEntityLink';

import './EntityDeleteDialog.scss';

const messages = defineMessages({
  button_confirm: {
    id: 'entity.delete.confirm',
    defaultMessage: 'Delete',
  },
  button_cancel: {
    id: 'entity.delete.cancel',
    defaultMessage: 'Cancel',
  },
  delete_success: {
    id: 'entity.delete.success',
    defaultMessage: 'Successfully deleted',
  },
  delete_error: {
    id: 'entity.delete.error',
    defaultMessage: 'An error occured while attempting to delete this entity.',
  },
});

export class EntityDeleteDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocking: false,
      processingEntity: null,
      deletedEntities: [],
    };
    this.onDelete = this.onDelete.bind(this);
  }

  async onDelete() {
    const { entities, history, intl, redirectOnSuccess, toggleDialog } = this.props;
    const { blocking } = this.state;

    if (!blocking) {
      try {
        this.setState({ blocking: true });

        for (const entity of entities) {
          this.setState({ processingEntity: entity.id });
          await this.props.deleteEntity(entity.id);
          this.setState(({ deletedEntities }) => (
            { deletedEntities: [...deletedEntities, entity.id], processingEntity: null }
          ));
        }

        showSuccessToast(intl.formatMessage(messages.delete_success));
        if (redirectOnSuccess) {
          const parent = entities[0]?.getFirst('parent');
          const collection = entities[0]?.collection;
          const pathname = parent ? getEntityLink(parent) : getCollectionLink(collection);

          history.push({ pathname });
        }
        this.setState({ blocking: false });
        toggleDialog();
      } catch (e) {
        showErrorToast(intl.formatMessage(messages.delete_error));
        this.setState({ blocking: false });
      }
    }
  }

  render() {
    const { blocking, deletedEntities, processingEntity } = this.state;
    const { entities, intl } = this.props;

    return (
      <Alert
        isOpen={this.props.isOpen}
        className={c('EntityDeleteDialog', { 'blocking': blocking })}
        icon="trash"
        intent={Intent.DANGER}
        cancelButtonText={intl.formatMessage(messages.button_cancel)}
        confirmButtonText={intl.formatMessage(messages.button_confirm)}
        onCancel={this.props.toggleDialog}
        onConfirm={this.onDelete}
      >
        {!blocking && (
          <FormattedMessage
            id="entity.delete.question.multiple"
            defaultMessage={
              `Are you sure you want to delete the following
              {count, plural, one {item} other {items}}?`
            }
            values={{count: entities.length}}
          />
        )}
        {blocking && (
          <FormattedMessage
            id="entity.delete.progress"
            defaultMessage="Deleting..."
          />
        )}
        <ul className="EntityDeleteDialog__file-list">
          {entities.map(entity => {
            const isProcessing = processingEntity === entity.id;
            const isDeleted = deletedEntities.indexOf(entity.id) > -1;
            return (
              <li key={entity.id} className={c('EntityDeleteDialog__file-list__item', { 'deleted': isDeleted })}>
                <span className="EntityDeleteDialog__file-list__item__icon">
                  {isProcessing && <Spinner size={14} />}
                  {isDeleted && <Icon icon="tick" />}
                </span>
                <span className="EntityDeleteDialog__file-list__item__main">
                  <Entity.Label entity={entity} truncate={30} icon />
                </span>
              </li>
            )
          })}
        </ul>
      </Alert>
    );
  }
}

export default compose(
  withRouter,
  connect(null, { deleteEntity }),
  injectIntl,
)(EntityDeleteDialog);
