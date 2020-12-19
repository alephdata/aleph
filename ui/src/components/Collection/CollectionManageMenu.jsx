import React, { PureComponent } from 'react';
import { injectIntl, defineMessages } from 'react-intl';
import { Button, ButtonGroup, Popover, Menu, MenuItem, Intent } from '@blueprintjs/core';

import { Skeleton } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import CollectionEditDialog from 'dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionDeleteDialog from 'dialogs/CollectionDeleteDialog/CollectionDeleteDialog';
import CollectionReingestAlert from './CollectionReingestAlert';
import CollectionReindexAlert from './CollectionReindexAlert';


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
  renderSkeletonButton = (i) => (
    <Skeleton.Text key={i} type="span" length={5} className="bp3-button" />
  )

  renderSkeleton = () => {
    if (this.props.view) {
      return this.renderSkeletonButton();
    } else {
      return (
        <ButtonGroup>{[...Array(3).keys()].map(this.renderSkeletonButton)}</ButtonGroup>
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

  render() {
    const { collection, buttonProps = {} } = this.props;

    if (!collection.id || !collection.writeable) {
      return null;
    }

    return (
      <Popover>
        <Button icon="cog" rightIcon="caret-down" {...buttonProps} disabled={!collection.id} />
        <Menu>
          {this.getButtons().map(this.renderMenuItem)}
        </Menu>
      </Popover>
    );
  }
}

export default injectIntl(CollectionManageMenu);
