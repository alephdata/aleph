import React, { Component } from 'react';
import { Alert, Icon, Intent, Spinner } from '@blueprintjs/core';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import c from 'classnames';

import withRouter from 'app/withRouter';
import { Entity } from 'components/common';
import { showErrorToast, showSuccessToast } from 'app/toast';
import getCollectionLink from 'util/getCollectionLink';
import getEntityLink from 'util/getEntityLink';

import './EntityDeleteDialog.scss';

const messages = defineMessages({
  cancel: {
    id: 'entity.delete.cancel',
    defaultMessage: 'Cancel',
  },
  delete_confirm: {
    id: 'entity.delete.confirm',
    defaultMessage: 'Delete',
  },
  delete_success: {
    id: 'entity.delete.success',
    defaultMessage: 'Successfully deleted',
  },
  delete_error: {
    id: 'entity.delete.error',
    defaultMessage: 'An error occured while attempting to delete this entity.',
  },
  delete_progress: {
    id: 'entity.delete.progress',
    defaultMessage: 'Deleting...',
  },
  delete_question: {
    id: 'entity.delete.question.multiple',
    defaultMessage: `Are you sure you want to delete the following
    {count, plural, one {item} other {items}}?`,
  },
  remove_confirm: {
    id: 'entity.remove.confirm',
    defaultMessage: 'Remove',
  },
  remove_success: {
    id: 'entity.remove.success',
    defaultMessage: 'Successfully removed',
  },
  remove_error: {
    id: 'entity.remove.error',
    defaultMessage: 'An error occured while attempting to remove this entity.',
  },
  remove_progress: {
    id: 'entity.remove.progress',
    defaultMessage: 'Removing...',
  },
  remove_question: {
    id: 'entity.remove.question.multiple',
    defaultMessage: `Are you sure you want to remove the following
    {count, plural, one {item} other {items}}?`,
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
    const {
      actionType,
      deleteEntity,
      entities,
      navigate,
      intl,
      redirectOnSuccess,
      toggleDialog,
    } = this.props;
    const { blocking } = this.state;

    if (!blocking) {
      try {
        this.setState({ blocking: true });

        for (const entity of entities) {
          this.setState({ processingEntity: entity.id });
          await deleteEntity(entity.id);

          this.setState(({ deletedEntities }) => ({
            deletedEntities: [...deletedEntities, entity.id],
            processingEntity: null,
          }));
        }

        showSuccessToast(intl.formatMessage(messages[`${actionType}_success`]));
        if (redirectOnSuccess) {
          const parent = entities[0]?.getFirst('parent');
          const collection = entities[0]?.collection;

          navigate(
            parent
              ? { pathname: getEntityLink(parent) }
              : getCollectionLink({ collection })
          );
        }
        this.setState({ blocking: false });
        toggleDialog(true);
      } catch (e) {
        showErrorToast(intl.formatMessage(messages[`${actionType}_error`]));
        this.setState({ blocking: false });
      }
    }
  }

  render() {
    const { blocking, deletedEntities, processingEntity } = this.state;
    const { actionType, entities, intl } = this.props;

    const icon = actionType === 'remove' ? 'delete' : 'trash';

    return (
      <Alert
        isOpen={this.props.isOpen}
        className={c('EntityDeleteDialog', { blocking: blocking })}
        icon={icon}
        intent={Intent.DANGER}
        cancelButtonText={intl.formatMessage(messages.cancel)}
        confirmButtonText={intl.formatMessage(
          messages[`${actionType}_confirm`]
        )}
        onCancel={this.props.toggleDialog}
        onConfirm={this.onDelete}
      >
        {!blocking &&
          intl.formatMessage(messages[`${actionType}_question`], {
            count: entities.length,
          })}
        {blocking && intl.formatMessage(messages[`${actionType}_progress`])}
        <ul className="EntityDeleteDialog__file-list">
          {entities.map((entity) => {
            const isProcessing = processingEntity === entity.id;
            const isDeleted = deletedEntities.indexOf(entity.id) > -1;
            return (
              <li
                key={entity.id}
                className={c('EntityDeleteDialog__file-list__item', {
                  deleted: isDeleted,
                })}
              >
                {(isProcessing || isDeleted) && (
                  <span className="EntityDeleteDialog__file-list__item__icon">
                    {isProcessing && <Spinner size={14} />}
                    {isDeleted && <Icon icon="tick" />}
                  </span>
                )}
                <span className="EntityDeleteDialog__file-list__item__main">
                  <Entity.Label entity={entity} truncate={30} icon />
                </span>
              </li>
            );
          })}
        </ul>
      </Alert>
    );
  }
}

export default compose(withRouter, injectIntl)(EntityDeleteDialog);
