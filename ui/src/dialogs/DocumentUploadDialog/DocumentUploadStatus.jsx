import React, { PureComponent } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { ProgressBar } from '@blueprintjs/core';

// import './DocumentUploadStatus.scss';


export class DocumentUploadStatus extends PureComponent {
  render() {
    const { percentCompleted, uploading } = this.props;

    return (
      <div>
        <p>
          <FormattedMessage
            id="document.upload.progress"
            defaultMessage="Uploading: {file}..."
            values={{ file: uploading }}
          />
        </p>
        <ProgressBar
          value={percentCompleted}
          animate={false}
          stripes={false}
          className="bp3-intent-success document-upload-progress-bar"
        />
        <p className="text-muted">
          <FormattedMessage
            id="document.upload.notice"
            defaultMessage="Once the upload is complete, it will take a few moments for the document to be processed and become searchable."
          />
        </p>
      </div>
    );
  }
}

export default injectIntl(DocumentUploadStatus);
