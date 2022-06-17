// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent, Position } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';

import { selectSession } from 'selectors';
import EntitySetCreateDialog from 'dialogs/EntitySetCreateDialog/EntitySetCreateDialog';

const messages = defineMessages({
  list_create: {
    id: 'list.create.button',
    defaultMessage: 'New list',
  },
  diagram_create: {
    id: 'diagram.create.button',
    defaultMessage: 'New diagram',
  },
  timeline_create: {
    id: 'timeline.create.button',
    defaultMessage: 'New timeline',
  },
  list_login: {
    id: 'list.create.login',
    defaultMessage: 'You must log in to create a list',
  },
  diagram_login: {
    id: 'diagram.create.login',
    defaultMessage: 'You must log in to create a diagram',
  },
  timeline_login: {
    id: 'timeline.create.login',
    defaultMessage: 'You must log in to create a timeline',
  },
});

const BUTTON_ICON = {
  diagram: 'send-to-graph',
  list: 'add-to-artifact',
  timeline: 'add',
}

class EntitySetCreateMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      importEnabled: false,
    };
    this.toggleDialog = this.toggleDialog.bind(this);
  }

  toggleDialog = (importEnabled) => this.setState(({ isOpen }) => (
    { isOpen: !isOpen, importEnabled }
  ));

  render() {
    const { type, collection, intl, session } = this.props;
    const { isOpen, importEnabled } = this.state;
    const canAdd = session?.loggedIn;
    const canImportDiagram = type === 'diagram';

    const buttonContent = (
      <ButtonGroup>
        <Button onClick={() => this.toggleDialog(false)} icon={BUTTON_ICON[type]} intent={Intent.PRIMARY} disabled={!canAdd}>
          {intl.formatMessage(messages[`${type}_create`])}
        </Button>
        {canImportDiagram && (
          <Button onClick={() => this.toggleDialog(true)} icon="import" disabled={!canAdd}>
            <FormattedMessage id="diagram.import.button" defaultMessage="Import diagram" />
          </Button>
        )}
      </ButtonGroup>
    );

    return (
      <>
        {canAdd && buttonContent}
        {!canAdd && (
          <Tooltip
            content={intl.formatMessage(messages[`${type}_login`])}
            position={Position.BOTTOM}
          >
            {buttonContent}
          </Tooltip>
        )}
        <EntitySetCreateDialog
          importEnabled={importEnabled}
          isOpen={isOpen}
          toggleDialog={this.toggleDialog}
          entitySet={{ collection, type }}
          canChangeCollection={!collection}
        />
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  session: selectSession(state),
});

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(EntitySetCreateMenu);
