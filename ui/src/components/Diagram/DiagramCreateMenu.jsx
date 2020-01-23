import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';

import DiagramEditDialog from 'src/dialogs/DiagramEditDialog/DiagramEditDialog';


class DiagramCreateMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      importEnabled: false,
    };
    this.toggleDialog = this.toggleDialog.bind(this);
  }

  toggleDialog = (importEnabled) => this.setState(({ isOpen }) => ({ isOpen: !isOpen, importEnabled }));

  render() {
    const { collection, intl, session } = this.props;
    const {
      isOpen, importEnabled,
    } = this.state;

    // if (!session.loggedIn) {
    //   return (
    //     <Tooltip
    //       content={intl.formatMessage(messages.login)}
    //       position={Position.BOTTOM}
    //     >
    //       <AnchorButton icon="send-to-graph" intent={Intent.PRIMARY} disabled>
    //         <FormattedMessage id="diagrams.index.create" defaultMessage="New diagram" />
    //       </AnchorButton>
    //     </Tooltip>
    //   );
    // }
    return (
      <>
        <ButtonGroup>
          <Button onClick={() => this.toggleDialog(false)} icon="send-to-graph" intent={Intent.PRIMARY}>
            <FormattedMessage id="diagrams.index.create" defaultMessage="New diagram" />
          </Button>
          <Button onClick={() => this.toggleDialog(true)} icon="import">
            <FormattedMessage id="diagrams.index.import" defaultMessage="Import diagram" />
          </Button>
        </ButtonGroup>
        <DiagramEditDialog
          isCreate
          importEnabled={importEnabled}
          isOpen={isOpen}
          toggleDialog={this.toggleDialog}
          diagram={{ collection }}
          canChangeCollection={!collection}
        />
      </>
    );
  }
}

DiagramCreateMenu = injectIntl(DiagramCreateMenu);
export default DiagramCreateMenu;
