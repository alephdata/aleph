import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Callout, Intent } from '@blueprintjs/core';

import { Date } from 'src/components/common';
import { triggerCollectionCancel, fetchCollectionStatus } from 'src/actions';
import { selectCollectionStatus } from 'src/selectors';

import './MappingStatus.scss';

class MappingStatus extends Component {
  constructor(props) {
    super(props);
    this.fetchStatus = this.fetchStatus.bind(this);
    // this.onCancel = this.onCancel.bind(this);
  }

  componentDidMount() {
    this.fetchStatus();
  }

  componentWillUnmount() {
    // clearTimeout(this.timeout);
  }

  // onCancel() {
  //   // const { collection } = this.props;
  //   // this.props.triggerCollectionCancel(collection.id);
  // }

  fetchStatus() {
    const { collection } = this.props;
    this.props.fetchCollectionStatus(collection)
      .finally(() => {
        const { status } = this.props;
        const duration = status.pending === 0 ? 6000 : 2000;
        this.timeout = setTimeout(this.fetchStatus, duration);
      });
  }

  // existingMapping && (
  //   <div className="bp3-callout bp3-intent-primary EntityImport__status">
  //     <div>
  //       <h4 className="bp3-heading">Mapping Status</h4>
  //       <div>
  //         <span className="bp3-heading">Created at:</span>
  //         <span><Date value={existingMapping.created_at} showTime /></span>
  //       </div>
  //       <div>
  //         <span className="bp3-heading">Last updated:</span>
  //         <span><Date value={existingMapping.updated_at} showTime /></span>
  //       </div>
  //       {existingMapping.last_run_status && (
  //         <div>
  //           <span className="bp3-heading">Running status:</span>
  //           <span>{existingMapping.last_run_status}</span>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // )

  render() {
    const { mapping, status } = this.props;
    console.log('status', status);
    return (
      <Callout
        className="MappingStatus"
        intent={Intent.PRIMARY}
      >
        <div>
          <h4 className="bp3-heading">Status</h4>
          <h6 className="bp3-heading MappingStatus__statusItem">
            <FormattedMessage
              id="collection.status.remaining"
              defaultMessage="Mapping first created:"
            />
            <Date value={mapping.created_at} showTime />
          </h6>

          <h6 className="bp3-heading MappingStatus__statusItem">
            <FormattedMessage
              id="collection.status.remaining"
              defaultMessage="Last updated:"
            />
            <Date value={mapping.updated_at} showTime />
          </h6>
        </div>
        {/*
        <h6 className="bp3-heading total-count">
          <FormattedMessage
            id="collection.status.remaining"
            defaultMessage="{finished} of {total} completed"
            values={{ finished: <Numeric num={finished} />, total: <Numeric num={total} /> }}
          />
        </h6>
        <div className="progress-area">
          <ProgressBar animate intent={Intent.PRIMARY} value={progress} />
          <Tooltip content={intl.formatMessage(messages.cancel_button)}>
            <Button onClick={this.onCancel} icon="delete" minimal />
          </Tooltip>
        </div>
        <FormattedMessage
          id="collection.status.message"
          defaultMessage="Continue to frolic about while data is being processed."
        />
        */}
      </Callout>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return { status: selectCollectionStatus(state, collection.id) };
};
const mapDispatchToProps = { fetchCollectionStatus, triggerCollectionCancel };
MappingStatus = connect(mapStateToProps, mapDispatchToProps)(MappingStatus);
MappingStatus = injectIntl(MappingStatus);
export default MappingStatus;
