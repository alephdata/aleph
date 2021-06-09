import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { AnchorButton, ControlGroup } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';

import { ResultText } from 'components/common';
import ExportDialog from 'dialogs/ExportDialog/ExportDialog';
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
    const { children, customResultText, intl, result, onExport, exportDisabled } = this.props;

    let tooltipText;
    if (!result.total) {
      tooltipText = intl.formatMessage(messages.export_disabled_empty);
    } else if (result.total > 10000) {
      tooltipText = intl.formatMessage(messages.export_disabled);
    } else {
      tooltipText = intl.formatMessage(messages.export_helptext);
    }

    return (
      <ControlGroup className="SearchActionBar" fill>
        <div className="SearchActionBar__main">
          <ResultText result={result} customText={customResultText} />
          {(!!onExport && !!result.total) && (
            <span className="SearchActionBar__export">
              <Tooltip content={tooltipText}>
                <DialogToggleButton
                  ButtonComponent={AnchorButton}
                  buttonProps={{
                    icon: "export",
                    text: intl.formatMessage(messages.export),
                    disabled: exportDisabled,
                    small: true,
                    outlined: true
                  }}
                  Dialog={ExportDialog}
                  dialogProps={{ onExport }}
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

export default injectIntl(SearchActionBar);
