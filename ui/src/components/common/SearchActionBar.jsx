import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { AnchorButton, ControlGroup } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';

import { ResultText } from 'components/common';
import ExportDialog from 'dialogs/ExportDialog/ExportDialog';
import { triggerQueryExport } from 'src/actions';
import { DialogToggleButton } from 'components/Toolbar';

import './SearchActionBar.scss';

const messages = defineMessages({
  export: {
    id: 'search.screen.export',
    defaultMessage: 'Export',
  },
  export_helptext: {
    id: 'search.screen.export_helptext',
    defaultMessage: 'Export results',
  },
  export_disabled: {
    id: 'search.screen.export_disabled',
    defaultMessage: 'Cannot export more than 10,000 results at a time',
  },
  export_disabled_empty: {
    id: 'search.screen.export_disabled_empty',
    defaultMessage: 'No results to export.',
  }
});

class SearchActionBar extends React.Component {
  render() {
    const { children, customResultText, intl, result } = this.props;

    const exportLink = result.total > 0 ? result.links?.export : null;
    let tooltipText;
    if (exportLink) {
      tooltipText = intl.formatMessage(messages.export_helptext);
    } else {
      tooltipText = intl.formatMessage(result.total > 0 ? messages.export_disabled : messages.export_disabled_empty);
    }

    return (
      <ControlGroup className="SearchActionBar" fill>
        <div className="SearchActionBar__main">
          <ResultText result={result} customText={customResultText} />
          {!result.isPending && (
            <span className="SearchActionBar__export">
              <Tooltip content={tooltipText}>
                <DialogToggleButton
                  ButtonComponent={AnchorButton}
                  buttonProps={{
                    icon: "export",
                    text: intl.formatMessage(messages.export),
                    disabled: !exportLink,
                    small: true,
                    outlined: true
                  }}
                  Dialog={ExportDialog}
                  dialogProps={{
                    onExport: () => this.props.triggerQueryExport(exportLink)
                  }}
                />
              </Tooltip>
            </span>
          )}
        </div>
        {children}
      </ControlGroup>
    );
  }
}

export default compose(
  connect(null, { triggerQueryExport }),
  injectIntl,
)(SearchActionBar);
