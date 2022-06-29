{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';
import { Button } from '@blueprintjs/core';
import { injectIntl, defineMessages } from 'react-intl';
import { Count } from 'components/common';
import EntityDeleteDialog from 'dialogs/EntityDeleteDialog/EntityDeleteDialog';


const messages = defineMessages({
  delete: {
    id: 'entity.manager.delete',
    defaultMessage: 'Delete',
  },
  remove: {
    id: 'entity.manager.remove',
    defaultMessage: 'Remove',
  },
});


class EntityDeleteButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
    this.toggle = this.toggle.bind(this);
  }

  toggle(isSuccess) {
    const { onSuccess } = this.props;
    if (isSuccess && onSuccess) {
      onSuccess();
    }

    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  }

  render() {
    const { deleteEntity, entities, intl, actionType, redirectOnSuccess, showCount } = this.props;
    const { isOpen } = this.state;

    const buttonIcon = actionType === 'remove' ? 'delete' : 'trash';
    const buttonText = intl.formatMessage(messages[actionType]);

    return (
      <>
        <Button icon={buttonIcon} onClick={() => this.toggle()} disabled={!entities.length} className="EntityActionBar__delete">
          {buttonText}
          {showCount && <Count count={entities.length || null} />}
        </Button>
        <EntityDeleteDialog
          entities={entities}
          isOpen={isOpen}
          toggleDialog={this.toggle}
          deleteEntity={deleteEntity}
          actionType={actionType}
          redirectOnSuccess={redirectOnSuccess}
        />
      </>
    );
  }
}

EntityDeleteButton = injectIntl(EntityDeleteButton);
export default EntityDeleteButton;
