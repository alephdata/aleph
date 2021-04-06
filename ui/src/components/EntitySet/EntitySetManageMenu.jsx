import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { ButtonGroup, Tooltip } from '@blueprintjs/core';

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
  renderSettings = (showText = true) => {
    const { entitySet, intl } = this.props;
    const text = intl.formatMessage(messages.edit);
    const button = (
      <DialogToggleButton
        buttonProps={{
          icon: "cog",
          text: showText && text
        }}
        Dialog={EntitySetEditDialog}
        dialogProps={{ entitySet, canChangeCollection: false }}
      />
    );
    return showText ? button : <Tooltip content={text}>{button}</Tooltip>;
  }

  renderExport = (showText = true) => {
    const { entitySet, exportFtm, exportSvg, intl } = this.props;
    const text = intl.formatMessage(messages.export);
    const button = (
      <DialogToggleButton
        buttonProps={{
          icon: "export",
          text: showText && text
        }}
        Dialog={DiagramExportDialog}
        dialogProps={{ entitySet, exportFtm, exportSvg }}
      />
    );
    return showText ? button : <Tooltip content={text}>{button}</Tooltip>;
  }

  renderDelete = (showText = true) => {
    const { entitySet, intl } = this.props;
    const text = intl.formatMessage(messages.delete);
    const button = (
      <DialogToggleButton
        buttonProps={{
          icon: "trash",
          text: showText && text
        }}
        Dialog={EntitySetDeleteDialog}
        dialogProps={{ entitySet }}
      />
    )
    return showText ? button : <Tooltip content={text}>{button}</Tooltip>;
  }

  render() {
    const { entitySet } = this.props;
    const isTimeline = entitySet.type === 'timeline';
    const isDiagram = entitySet.type === 'diagram';

    if (!entitySet.writeable && isDiagram) {
      return this.renderExport();
    }

    if (isDiagram || isTimeline) {
      return (
        <ButtonGroup minimal>
          {this.renderSettings(false)}
          {isDiagram && this.renderExport(false)}
          {this.renderDelete(false)}
        </ButtonGroup>
      );
    } else {
      return (
        <ButtonGroup className="EntitySetManageMenu">
          {this.renderSettings()}
          {this.renderDelete()}
        </ButtonGroup>
      );
    }
  }
}

EntitySetManageMenu = injectIntl(EntitySetManageMenu);
export default EntitySetManageMenu;
