import React, { PureComponent } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { ProgressBar } from '@blueprintjs/core';
import DocumentUploadTrace from './DocumentUploadTrace';

import './DocumentUploadStatus.scss';
import DocumentUploadActionsDone from './DocumentUploadActionsDone';
import DocumentUploadActionsPending from './DocumentUploadActionsPending';

export const UPLOAD_STATUS = {
  PENDING: 1,
  ERROR: 2,
  SUCCESS: 3,
};

function computePercentCompleted(uploadTraces, uploadMeta) {
  if (uploadMeta.status !== UPLOAD_STATUS.PENDING) {
    return 1;
  }

  if (uploadMeta.totalUploadSize <= 0) {
    //fallback if we don't know file sizes
    const done = uploadTraces.filter(
      (trace) => trace.status !== UPLOAD_STATUS.PENDING
    ).length;
    return done / uploadTraces.length;
  }

  return uploadTraces.reduce((result, trace) => {
    let summand = 0;
    if (trace.size) {
      // finished requests for folders are not reflected in the progress bar
      if (trace.status === UPLOAD_STATUS.PENDING && trace.size) {
        summand =
          (((trace.uploaded / trace.total) * trace.size) /
            uploadMeta.totalUploadSize) *
          0.9; // reserve 10% for the request complete event
      } else if (
        trace.status === UPLOAD_STATUS.SUCCESS ||
        trace.status === UPLOAD_STATUS.ERROR
      ) {
        summand = trace.size / uploadMeta.totalUploadSize;
      }
    }
    return result + summand;
  }, 0);
}

export class DocumentUploadStatus extends PureComponent {
  render() {
    const { uploadTraces, uploadMeta, onClose, onRetry } = this.props;
    const stats = {
      errors: uploadTraces.filter(
        (trace) => trace.status === UPLOAD_STATUS.ERROR
      ).length,
      filesDone: uploadTraces.filter(
        (trace) =>
          trace.type === 'file' && trace.status !== UPLOAD_STATUS.PENDING
      ).length,
    };

    return (
      <div>
        <ProgressBar
          value={computePercentCompleted(uploadTraces, uploadMeta)}
          animate={false}
          stripes={false}
          intent={stats.errors > 0 ? 'warning' : 'success'}
          className="document-upload-progress-bar"
        />
        <p>
          <FormattedMessage
            id="document.upload.progress"
            defaultMessage="{done} of {total} files done, {errors} errors."
            values={{
              done: stats.filesDone,
              total: uploadMeta.totalFiles,
              errors: stats.errors,
            }}
          />
        </p>
        <ul className={'bp3-list-unstyled DocumentUploadStatus__list'}>
          {uploadTraces.map((trace, index) => (
            <DocumentUploadTrace trace={trace} key={index} />
          ))}
        </ul>

        {uploadMeta.status === UPLOAD_STATUS.PENDING && (
          <DocumentUploadActionsPending onClose={onClose} />
        )}
        {uploadMeta.status !== UPLOAD_STATUS.PENDING && (
          <DocumentUploadActionsDone
            stats={stats}
            onRetry={onRetry}
            onClose={onClose}
          />
        )}
      </div>
    );
  }
}

export default injectIntl(DocumentUploadStatus);
