import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { AnchorButton, ButtonGroup, Classes } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';

import ExportDialog from 'dialogs/ExportDialog/ExportDialog';
import { triggerQueryExport } from 'src/actions';
import { DialogToggleButton } from 'components/Toolbar';


const messages = defineMessages({
  export: {
    id: 'search.screen.export',
    defaultMessage: 'Export',
  },
  alert_export_disabled: {
    id: 'search.screen.export_disabled',
    defaultMessage: 'Cannot export more than 10,000 results at a time',
  },
  alert_export_disabled_empty: {
    id: 'search.screen.export_disabled_empty',
    defaultMessage: 'No results to export.',
  },
  dates: {
    id: 'search.screen.dates',
    defaultMessage: 'Date distribution',
  },
  date_facet_disabled: {
    id: 'search.screen.dates_disabled',
    defaultMessage: 'No date distribution available',
  },
});


class EntitySearchManageMenu extends Component {
  constructor(props) {
    super(props);

    this.toggleDateFacet = this.toggleDateFacet.bind(this);
  }

  toggleDateFacet() {
    const { dateFacetIsOpen, query, updateQuery } = this.props;
    let newQuery;
    if (dateFacetIsOpen) {
      newQuery = query.remove('facet', 'dates')
        .remove('facet_interval:dates', 'year');
    } else {
      newQuery = query.add('facet', 'dates')
        .add('facet_interval:dates', 'year');
    }
    updateQuery(newQuery);
  }

  render() {
    const { dateFacetDisabled, dateFacetIsOpen, intl, result } = this.props;

    const dateTooltip = intl.formatMessage(messages.date_facet_disabled);
    const exportLink = result?.total > 0 ? result?.links?.export : null;
    const exportTooltip = intl.formatMessage(result?.total > 0 ? messages.alert_export_disabled : messages.alert_export_disabled_empty);

    return (
      <ButtonGroup className={Classes.FIXED}>
        <Tooltip content={dateTooltip} disabled={!dateFacetDisabled}>
          <AnchorButton
            icon="calendar"
            onClick={this.toggleDateFacet}
            disabled={dateFacetDisabled}
            active={dateFacetIsOpen}
            text={intl.formatMessage(messages.dates)}
          />
        </Tooltip>
        <Tooltip content={exportTooltip} disabled={exportLink}>
          <DialogToggleButton
            ButtonComponent={AnchorButton}
            buttonProps={{
              text: intl.formatMessage(messages.export),
              icon: "export",
              disabled: !exportLink,
            }}
            Dialog={ExportDialog}
            dialogProps={{
              onExport: () => this.props.triggerQueryExport(exportLink)
            }}
          />
        </Tooltip>
      </ButtonGroup>
    );
  }
}

export default compose(
  withRouter,
  connect(null, { triggerQueryExport }),
  injectIntl,
)(EntitySearchManageMenu);
