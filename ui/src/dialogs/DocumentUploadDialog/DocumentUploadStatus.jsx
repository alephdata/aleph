import React, { PureComponent } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { ProgressBar } from '@blueprintjs/core';

function computePercentCompleted(uploadTraces, totalUploadSize) {
  if (totalUploadSize <= 0) { //fallback if we don't know file sizes
    const done = uploadTraces.filter(trace => trace.status !== "pending").length;
    return done / uploadTraces.length;
  }

  return uploadTraces.reduce((result, trace) => {
    let summand = 0;
    if (trace.size) { // finished requests for folders are not reflected in the progress bar
      if (trace.status === "pending" && trace.size) {
        summand = ((trace.uploaded / trace.total * trace.size) / totalUploadSize) * 0.9; // reserve 10% for the request complete event
      }
      else if (trace.status === "done" || trace.status === "error") {
        summand = trace.size / totalUploadSize;
      }
    }
    return result + summand;
  }, 0);
}


export class DocumentUploadStatus extends PureComponent {
  render() {
    const { uploadTraces, totalUploadSize } = this.props;
    const currUploadingFiles = uploadTraces
      .filter(trace => trace.status === 'pending')
      .sort((a, b) => b.uploaded - a.uploaded);

    return (
      <div>
        <ProgressBar
          value={computePercentCompleted(uploadTraces, totalUploadSize)}
          animate={false}
          stripes={false}
          className="bp3-intent-success document-upload-progress-bar"
        />
        <p className="text-muted">
          <FormattedMessage
            id="document.upload.notice"
            defaultMessage="Once the upload is complete, it will take a few moments for the documents to be processed and become searchable."
          />
        </p>
        <p>
          {currUploadingFiles.length > 0 && <FormattedMessage
            id="document.upload.progress"
            defaultMessage="Uploading: {file}..."
            values={{ file: currUploadingFiles[0].name }}
          />}
        </p>
      </div>
    );
  }
}

export default injectIntl(DocumentUploadStatus);
