import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { ProgressBar, Intent } from '@blueprintjs/core';

import { Numeric } from 'src/components/common';
import { triggerCollectionCancel, fetchCollectionStatus } from 'src/actions';
import { selectCollectionStatus } from 'src/selectors';
// import wordList from 'src/util/wordList';


class CollectionStatus extends Component {
  constructor(props) {
    super(props);
    this.fetchStatus = this.fetchStatus.bind(this);
    this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    this.fetchStatus();
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  onCancel() {
    const { collection } = this.props;
    this.props.triggerCollectionCancel(collection.id);
  }

  fetchStatus() {
    const { collection, status } = this.props;
    this.props.fetchCollectionStatus(collection);
    const duration = status.pending === 0 ? 6000 : 2000;
    this.timeout = setTimeout(this.fetchStatus, duration);
  }

  render() {
    const { collection, status } = this.props;
    const pending = status.pending || 0;
    const finished = status.finished || 0;
    if (!collection || status.shouldLoad || !pending) {
      return null;
    }
    const progress = finished / (pending + finished);
    return (
      <div className="bp3-callout">
        <ProgressBar animate intent={Intent.PRIMARY} value={progress} />
        <FormattedMessage
          id="collection.status.done"
          defaultMessage="{count} tasks done"
          values={{ count: <Numeric num={finished} /> }}
        />
        {pending > 5 && (
          <FormattedMessage
            id="collection.status.pending"
            defaultMessage=" ({count} pending)"
            values={{ count: <Numeric num={pending} /> }}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return { status: selectCollectionStatus(state, collection.id) };
};
const mapDispatchToProps = { fetchCollectionStatus, triggerCollectionCancel };
CollectionStatus = connect(mapStateToProps, mapDispatchToProps)(CollectionStatus);
export default CollectionStatus;
