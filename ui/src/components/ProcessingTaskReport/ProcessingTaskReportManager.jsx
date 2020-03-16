import React, { Component } from 'react';
import { Callout } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { ErrorSection } from 'src/components/common';
import QueryTags from 'src/components/QueryTags/QueryTags';
import ProcessingTaskReportSearch from './ProcessingTaskReportSearch';

import './ProcessingTaskReportManager.scss';

const messages = defineMessages({
  reprocess: {
    id: 'report.manager.reprocess',
    defaultMessage: 'Re-process',
  },
  empty: {
    id: 'report.manager.empty',
    defaultMessage: 'No processing reports for this collection.',
  },
  running: {
    id: 'report.manager.running',
    defineMessages: 'There is currently a processing job running.',
  },
});


export class ProcessingTaskReportManager extends Component {
  render() {
    const { query, result, hasPending, intl } = this.props;

    const emptyComponent = (
      <div className="ProcessingTaskReportManager__content__empty">
        <ErrorSection
          icon="grouped-bar-chart"
          title={intl.formatMessage(messages.empty)}
        />
      </div>
    );

    return (
      <div className="ProcessingTaskReportManager">
        <div className="ProcessingTaskReportManager__header">
          <QueryTags query={query} updateQuery={this.props.updateQuery} />
        </div>
        { hasPending && (
          <Callout className="bp3-icon-info-sign bp3-intent-warning">
            <FormattedMessage
              id="report.manager.running"
              defaultMessage="Documents are being processed. Please wait..."
            />
          </Callout>
        )}
        <div className="ProcessingTaskReportManager__content">
          <ProcessingTaskReportSearch
            query={query}
            result={result}
            updateQuery={this.props.updateQuery}
            emptyComponent={emptyComponent}
          />
        </div>
      </div>
    );
  }
}

export default compose(injectIntl)(ProcessingTaskReportManager);
