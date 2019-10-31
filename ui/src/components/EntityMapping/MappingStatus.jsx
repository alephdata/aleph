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
    const { mapping } = this.props;
    let intent = mapping.last_run_status === 'success' ? Intent.SUCCESS : Intent.PRIMARY;
    if (mapping.last_run_error) {
      intent = Intent.DANGER;
    }
    return (
      <Callout
        className="MappingStatus"
        intent={intent}
      >
        <div>
          <h6 className="bp3-heading MappingStatus__statusItem">
            <span>
              <FormattedMessage
                id="collection.status.remaining"
                defaultMessage="Last updated:"
              />
            </span>
            <span>
              <Date value={mapping.updated_at} showTime />
            </span>
          </h6>
          {mapping.last_run_status && (
            <h6 className="bp3-heading MappingStatus__statusItem">
              <span>
                <FormattedMessage
                  id="collection.status.remaining"
                  defaultMessage="Import status:"
                />
              </span>
              <span>
                {mapping.last_run_status}
              </span>
            </h6>
          )}
          {mapping.last_run_err_msg && (
            <h6 className="bp3-heading MappingStatus__statusItem">
              <span>
                <FormattedMessage
                  id="collection.status.remaining"
                  defaultMessage="Import error:"
                />
              </span>
              <span>
                {mapping.last_run_err_msg}
              </span>
            </h6>
          )}
        </div>
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
