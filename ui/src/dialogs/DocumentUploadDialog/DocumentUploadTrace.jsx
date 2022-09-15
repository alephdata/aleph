import React from 'react';
import { Spinner, SpinnerSize, Icon } from '@blueprintjs/core';
import { UPLOAD_STATUS } from './DocumentUploadStatus';

const STATUS_SIZE = SpinnerSize.SMALL;

export default function DocumentUploadTrace({ trace }) {
  const renderStatus = () => {
    if (trace.status === UPLOAD_STATUS.PENDING) {
      if (trace.uploaded > 0) {
        return (
          <Spinner
            intent="primary"
            size={STATUS_SIZE}
            value={trace.uploaded / trace.total}
          />
        );
      } else {
        return <span />;
      }
    } else if (trace.status === UPLOAD_STATUS.SUCCESS) {
      return (
        <Icon intent="success" icon="tick-circle" iconSize={STATUS_SIZE} />
      );
    } else if (trace.status === UPLOAD_STATUS.ERROR) {
      return <Icon intent="danger" icon="error" iconSize={STATUS_SIZE} />;
    }
  };

  return (
    <li className="DocumentUploadTrace">
      <div className="DocumentUploadTrace__label">{trace.name}</div>
      <div className="DocumentUploadTrace__status">{renderStatus()}</div>
    </li>
  );
}
