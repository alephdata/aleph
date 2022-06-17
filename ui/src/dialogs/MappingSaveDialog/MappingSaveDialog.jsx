// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { Alert, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { deleteCollection } from 'actions';


const messages = defineMessages({
  button_confirm: {
    id: 'mapping.save.confirm',
    defaultMessage: 'Update mapping & re-generate',
  },
  button_cancel: {
    id: 'mapping.save.cancel',
    defaultMessage: 'Cancel',
  },
});


class MappingSaveDialog extends Component {
  render() {
    const { intl } = this.props;
    return (
      <Alert
        isOpen={this.props.isOpen}
        icon="floppy-disk"
        intent={Intent.PRIMARY}
        cancelButtonText={intl.formatMessage(messages.button_cancel)}
        confirmButtonText={intl.formatMessage(messages.button_confirm)}
        onCancel={this.props.toggleDialog}
        onConfirm={this.props.onSave}
      >
        <FormattedMessage
          id="mapping.save.question"
          defaultMessage="Updating this mapping will delete any previously generated entities and re-generate them. Are you sure you would like to continue?"
        />
      </Alert>
    );
  }
}

const mapDispatchToProps = { deleteCollection };

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl,
)(MappingSaveDialog);
