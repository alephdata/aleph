import React, { PureComponent } from 'react';
import { injectIntl, defineMessages } from 'react-intl';
import { Button, ButtonGroup, Popover, Menu, MenuItem, Intent } from '@blueprintjs/core';

import { DialogToggleButton } from 'components/Toolbar'
import CollectionEditDialog from 'dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionDeleteDialog from 'dialogs/CollectionDeleteDialog/CollectionDeleteDialog';
import CollectionReingestAlert from './CollectionReingestAlert';
import CollectionReindexAlert from './CollectionReindexAlert';
import { Skeleton } from 'components/common';


const messages = defineMessages({
  access: {
    id: 'collection.info.access',
    defaultMessage: 'Share',
  },
  edit: {
    id: 'collection.info.edit',
    defaultMessage: 'Settings',
  },
  delete_dataset: {
    id: 'collection.info.delete',
    defaultMessage: 'Delete dataset',
  },
  delete_casefile: {
    id: 'collection.info.delete_casefile',
    defaultMessage: 'Delete investigation',
  },
  reingest: {
    id: 'collection.info.reingest',
    defaultMessage: 'Re-ingest documents',
  },
  reindex: {
    id: 'collection.info.reindex',
    defaultMessage: 'Re-index all content',
  },
});


class CollectionManageMenu extends PureComponent {
  renderSkeletonButton = () => (
    <Button disabled>
      <Skeleton.Text type="span" length={10} />
    </Button>
  )

  renderSkeleton = () => {
    const { view } = this.props;
    if (view === 'collapsed') {
      return this.renderSkeletonButton();
    } else {
      return (
        <ButtonGroup fill>{[...Array(3).keys()].map(this.renderSkeletonButton)}</ButtonGroup>
      );
    };
  }

  getButtons = () => {
    const { intl, collection } = this.props;

    return [
      {
        buttonProps: {
          text: intl.formatMessage(messages.edit),
          icon: "cog",
        },
        Dialog: CollectionEditDialog,
        primary: true,
      },
      {
        buttonProps: {
          text: intl.formatMessage(messages.access),
          icon: "key",
        },
        Dialog: CollectionAccessDialog,
        primary: true,
      },
      {
        buttonProps: {
          text: intl.formatMessage(messages.reingest),
          icon: "automatic-updates",
        },
        Dialog: CollectionReingestAlert,
      },
      {
        buttonProps: {
          text: intl.formatMessage(messages.reindex),
          icon: "search-template",
        },
        Dialog: CollectionReindexAlert,
      },
      {
        buttonProps: {
          text: intl.formatMessage(messages[collection?.casefile ? 'delete_casefile' : 'delete_dataset']),
          icon: "trash",
          intent: Intent.DANGER,
        },
        Dialog: CollectionDeleteDialog,
      },
    ]
  }

  renderMenuItem = ({ buttonProps, Dialog }) => (
    <DialogToggleButton
      key={buttonProps.icon}
      ButtonComponent={MenuItem}
      buttonProps={{
        shouldDismissPopover: false,
        ...buttonProps,
        ...(this.props.buttonProps)
      }}
      Dialog={Dialog}
      dialogProps={{ collection: this.props.collection }}
    />
  );

  renderButton = ({ buttonProps, Dialog }) => (
    <DialogToggleButton
      key={buttonProps.icon}
      buttonProps={{
        ...buttonProps,
        ...(this.props.buttonProps)
      }}
      Dialog={Dialog}
      dialogProps={{ collection: this.props.collection }}
    />
  );

  render() {
    const { collection, buttonGroupProps = {}, buttonProps = {}, view = "default" } = this.props;
    if (collection.isPending) {
      return this.renderSkeleton();
    }
    if (!collection.writeable) {
      return null;
    }
    const buttons = this.getButtons();

    if (view === 'collapsed') {
      return (
        <Popover>
          <Button icon="cog" rightIcon="caret-down" {...buttonProps} />
          <Menu>
            {buttons.map(this.renderMenuItem)}
          </Menu>
        </Popover>
      );
    } else if (view === 'semi-collapsed') {
      return (
        <ButtonGroup fill {...buttonGroupProps}>
          {buttons.filter(button => button.primary).map(this.renderButton)}
          <Popover>
            <Button icon="caret-down" {...buttonProps} />
            {buttons.filter(button => !button.primary).map(this.renderMenuItem)}
          </Popover>
        </ButtonGroup>
      );
    } else {
      return (
        <ButtonGroup fill {...buttonGroupProps}>
          {buttons.map(this.renderButton)}
        </ButtonGroup>
      );
    }
  }
}

CollectionManageMenu = injectIntl(CollectionManageMenu);
export default CollectionManageMenu;
