import _ from 'lodash';
import React, { Component } from 'react';
import { Callout, Button } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { Count, ErrorSection } from 'src/components/common';
import ProcessingTasksReprocessingDialog from 'src/dialogs/ProcessingTasksReprocessDialog/ProcessingTasksReprocessDialog';
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
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      reprocessingIsOpen: false,
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleSelectAll = this.toggleSelectAll.bind(this);
    this.toggleReprocessingDialog = this.toggleReprocessingDialog.bind(this);
  }

  updateSelection(report) {
    const { selection } = this.state;
    this.setState({
      selection: _.xorBy(selection, [report], 'id'),
    });
  }

  toggleSelectAll(selection) {
    const { allSelected } = this.state;
    if (allSelected) {
      this.setState({ allSelected: false, selection: [] });
    } else {
      this.setState({ allSelected: true, selection });
    }
  }

  toggleReprocessingDialog() {
    const { reprocessingIsOpen } = this.state;
    this.setState({ reprocessingIsOpen: !reprocessingIsOpen });
  }

  render() {
    const { query, result, hasPending, intl } = this.props;
    const { selection } = this.state;

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
        <div className="bp3-button-group">
          <Button icon="automatic-updates" onClick={this.toggleReprocessingDialog} disabled={!selection.length}>
            <FormattedMessage id="report.manager.reprocess" defaultMessage="Re-process" />
            {selection.length > 0 && <Count count={selection.length} />}
          </Button>
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
            selection={selection}
            updateSelection={this.updateSelection}
            updateQuery={this.props.updateQuery}
            emptyComponent={emptyComponent}
            toggleSelectAll={this.toggleSelectAll}
            allSelected={this.state.allSelected}
          />
        </div>
        <ProcessingTasksReprocessingDialog
          tasks={selection}
          isOpen={this.state.reprocessingIsOpen}
          toggleDialog={this.toggleReprocessingDialog}
        />
      </div>
    );
  }
}

export default compose(injectIntl)(ProcessingTaskReportManager);
