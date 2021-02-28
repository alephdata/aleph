import React, { Component } from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Menu, MenuItem, Popover } from '@blueprintjs/core';

import { DialogToggleButton } from 'components/Toolbar';
import EntitySetEditDialog from 'dialogs/EntitySetEditDialog/EntitySetEditDialog';
import DiagramExportDialog from 'dialogs/DiagramExportDialog/DiagramExportDialog';
import EntitySetDeleteDialog from 'dialogs/EntitySetDeleteDialog/EntitySetDeleteDialog';

import './EntitySetManageMenu.scss';

const messages = defineMessages({
  edit: {
    id: 'entityset.info.edit',
    defaultMessage: 'Settings',
  },
  export: {
    id: 'entityset.info.export',
    defaultMessage: 'Export',
  },
  delete: {
    id: 'entityset.info.delete',
    defaultMessage: 'Delete',
  },
});

class EntitySetManageMenu extends Component {
  renderSettings = (componentType) => {
    const { entitySet, intl } = this.props;

    return (
      <DialogToggleButton
        ButtonComponent={componentType}
        buttonProps={{
          text: intl.formatMessage(messages.edit),
          icon: "cog",
          shouldDismissPopover: false
        }}
        Dialog={EntitySetEditDialog}
        dialogProps={{ entitySet, canChangeCollection: false }}
      />
    );
  }

  renderExport = (componentType) => {
    const { entitySet, exportFtm, exportSvg, intl } = this.props;

    return (
      <DialogToggleButton
        ButtonComponent={componentType}
        buttonProps={{
          text: intl.formatMessage(messages.export),
          icon: "export",
          shouldDismissPopover: false
        }}
        Dialog={DiagramExportDialog}
        dialogProps={{ entitySet, exportFtm, exportSvg }}
      />
    )
  }

  renderDelete = (componentType) => {
    const { entitySet, intl } = this.props;

    return (
      <DialogToggleButton
        ButtonComponent={componentType}
        buttonProps={{
          text: intl.formatMessage(messages.delete),
          icon: "trash",
          shouldDismissPopover: false
        }}
        Dialog={EntitySetDeleteDialog}
        dialogProps={{ entitySet }}
      />
    )
  }

  render() {
    const { entitySet, intl, triggerDownload } = this.props;
    const isDiagram = entitySet.type === 'diagram';

    if (!entitySet.writeable && isDiagram) {
      return this.renderExport(Button);
    }

    if (isDiagram) {
      return (
        <Popover className="EntitySetManageMenu">
          <Button icon="cog" rightIcon="caret-down" />
          <Menu>
            {this.renderSettings(MenuItem)}
            {this.renderExport(MenuItem)}
            {this.renderDelete(MenuItem)}
          </Menu>
        </Popover>
      );
    } else {
      return (
        <ButtonGroup className="EntitySetManageMenu">
          {this.renderSettings(Button)}
          {this.renderDelete(Button)}
        </ButtonGroup>
      );
    }
  }
}

EntitySetManageMenu = injectIntl(EntitySetManageMenu);
export default EntitySetManageMenu;
