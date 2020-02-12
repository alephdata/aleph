import _ from 'lodash';
import React, { Component } from 'react';
import { Callout, Button } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { ErrorSection } from 'src/components/common';
import { queryReports } from 'src/actions';
import ReportSearch from './ReportSearch';
import ReprocessingDialog from './ReprocessingDialog';

import './ReportManager.scss';

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


export class ReportManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      reprocessingIsOpen: false,
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleReprocessingDialog = this.toggleReprocessingDialog.bind(this);
  }

  updateSelection(document) {
    const { selection } = this.state;
    this.setState({
      selection: _.xorBy(selection, [document], 'id'),
    });
  }

  toggleReprocessingDialog() {
    const { reprocessingIsOpen } = this.state;
    if (reprocessingIsOpen) {
      this.setState({ selection: [] });
    }
    this.setState({ reprocessingIsOpen: !reprocessingIsOpen });
  }

  render() {
    const { query, hasPending, intl } = this.props;
    const { selection } = this.state;

    const emptyComponent = (
      <div className="ReportManager__content__empty">
        <ErrorSection
          icon="grouped-bar-chart"
          title={intl.formatMessage(messages.empty)}
        />
      </div>
    );

    return (
      <div className="ReportManager">
        <div className="bp3-button-group">
          <Button icon="automatic-updates" onClick={this.toggleReprocessingDialog} disabled={!selection.length}>
            <FormattedMessage id="report.manager.reprocess" defaultMessage="Re-process" />
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
        <div className="ReportManager__content">
          <ReportSearch
            query={query}
            selection={selection}
            updateSelection={this.updateSelection}
            emptyComponent={emptyComponent}
          />
        </div>
        <ReprocessingDialog
          tasks={selection}
          isOpen={this.state.reprocessingIsOpen}
          toggleDialog={this.toggleReprocessingDialog}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  let { query } = ownProps;
  if (!query.hasSort()) {
    query = query.sortBy('start_at', 'desc');
  }
  return { query };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryReports }),
  injectIntl,
)(ReportManager);
