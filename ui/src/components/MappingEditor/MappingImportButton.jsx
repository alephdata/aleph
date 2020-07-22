import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';
import MappingImportDialog from 'dialogs/MappingImportDialog/MappingImportDialog';


class MappingImportButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
    this.toggleDialog = this.toggleDialog.bind(this);
  }

  toggleDialog = () => this.setState(({ isOpen }) => (
    { isOpen: !isOpen }
  ));

  render() {
    const { onImport } = this.props;
    const { isOpen } = this.state;

    return (
      <>
        <Button onClick={() => this.toggleDialog()} icon="import">
          <FormattedMessage id="mapping.import.button" defaultMessage="Import existing mapping" />
        </Button>
        <MappingImportDialog
          isOpen={isOpen}
          toggleDialog={this.toggleDialog}
          onSubmit={onImport}
        />
      </>
    );
  }
}


export default injectIntl(MappingImportButton);
