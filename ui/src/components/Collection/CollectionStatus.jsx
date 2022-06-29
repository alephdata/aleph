{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { ProgressBar, Intent, Button } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import c from 'classnames';

import { Numeric } from 'components/common';
import { triggerCollectionCancel } from 'actions';

import './CollectionStatus.scss';

const messages = defineMessages({
  cancel_button: {
    id: 'collection.status.cancel_button',
    defaultMessage: 'Cancel the process',
  },
});

class CollectionStatus extends Component {
  constructor(props) {
    super(props);
    this.onCancel = this.onCancel.bind(this);
  }

  onCancel() {
    const { collection } = this.props;
    if (collection?.id) {
      this.props.triggerCollectionCancel(collection.id);
    }
  }

  render() {
    const { className, intl, showCancel, collection } = this.props;
    const { status = {} } = collection;
    if (!status.active) {
      return null;
    }
    return (
      <div className={c('CollectionStatus', className)}>
        <h4 className="bp3-heading">
          <FormattedMessage
            id="collection.status.title"
            defaultMessage="Update in progress ({percent}%)"
            values={{ percent: <Numeric num={status.percent} /> }}
          />
        </h4>
        <div className="progress-area">
          <ProgressBar animate intent={Intent.PRIMARY} value={status.progress} />
          {showCancel && (
            <Tooltip content={intl.formatMessage(messages.cancel_button)}>
              <Button onClick={this.onCancel} icon="delete" minimal />
            </Tooltip>
          )}
        </div>
        <FormattedMessage
          id="collection.status.message"
          defaultMessage="Continue to frolic about while data is being processed."
        />
      </div>
    );
  }
}

const mapDispatchToProps = { triggerCollectionCancel };

CollectionStatus = connect(null, mapDispatchToProps)(CollectionStatus);
CollectionStatus = injectIntl(CollectionStatus);
export default CollectionStatus;
