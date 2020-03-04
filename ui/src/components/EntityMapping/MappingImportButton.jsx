import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent, Position, Tooltip } from '@blueprintjs/core';
import MappingImportDialog from 'src/dialogs/MappingImportDialog/MappingImportDialog';


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
        <Button onClick={() => this.toggleDialog()} icon="import" intent={Intent.PRIMARY}>
          <FormattedMessage id="mapping.import.button" defaultMessage="Import mapping" />
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
