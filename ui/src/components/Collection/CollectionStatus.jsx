import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { ProgressBar, Intent, Button, Tooltip } from '@blueprintjs/core';
import c from 'classnames';

import { Numeric } from 'src/components/common';
import { triggerCollectionCancel } from 'src/actions';
import { selectCollectionStatus } from 'src/selectors';

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
    this.props.triggerCollectionCancel(collection.id);
  }

  render() {
    const { className, collection, intl, showCancel, status } = this.props;
    const pending = status.pending || 0;
    const running = status.running || 0;
    const finished = status.finished || 0;
    const active = pending + running;
    const total = active + finished;
    if (!collection || status.shouldLoad || !active) {
      return null;
    }
    const progress = finished / total;
    const percent = Math.round(progress * 100);
    return (
      <div className={c('CollectionStatus', className)}>
        <h4 className="bp3-heading">
          <FormattedMessage
            id="collection.status.title"
            defaultMessage="Update in progress ({percent}%)"
            values={{ percent: <Numeric num={percent} /> }}
          />
        </h4>
        <div className="progress-area">
          <ProgressBar animate intent={Intent.PRIMARY} value={progress} />
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

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return { status: selectCollectionStatus(state, collection.id) };
};
const mapDispatchToProps = { triggerCollectionCancel };
CollectionStatus = connect(mapStateToProps, mapDispatchToProps)(CollectionStatus);
CollectionStatus = injectIntl(CollectionStatus);
export default CollectionStatus;
