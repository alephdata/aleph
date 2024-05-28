import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';

import { DialogToggleButton } from 'components/Toolbar';
import EntitySetEditDialog from 'dialogs/EntitySetEditDialog/EntitySetEditDialog';
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
  exportAsSvg: {
    id: 'entityset.info.exportAsSvg',
    defaultMessage: 'Export as SVG',
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
          icon: 'cog',
          text: showText && text,
        }}
        Dialog={EntitySetEditDialog}
        dialogProps={{ entitySet, canChangeCollection: false }}
      />
    );
    return showText ? button : <Tooltip content={text}>{button}</Tooltip>;
  };

  renderExport = (showText = true) => {
    const { exportSvg, intl } = this.props;
    const text = intl.formatMessage(messages.exportAsSvg);

    const button = (
      <Button icon="export" text={showText && text} onClick={exportSvg} />
    );

    return showText ? button : <Tooltip content={text}>{button}</Tooltip>;
  };

  renderDelete = (showText = true) => {
    const { entitySet, intl } = this.props;
    const text = intl.formatMessage(messages.delete);
    const button = (
      <DialogToggleButton
        buttonProps={{
          icon: 'trash',
          text: showText && text,
        }}
        Dialog={EntitySetDeleteDialog}
        dialogProps={{ entitySet }}
      />
    );
    return showText ? button : <Tooltip content={text}>{button}</Tooltip>;
  };

  render() {
    const { entitySet } = this.props;
    const isTimeline = entitySet.type === 'timeline';
    const isDiagram = entitySet.type === 'diagram';

    if (!entitySet.writeable && isDiagram) {
      return this.renderExport();
    }

    if (!entitySet.writeable) {
      return null;
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
