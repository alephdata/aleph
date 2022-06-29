{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';
import { Button } from '@blueprintjs/core';

class DialogToggleButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };

    this.toggleDialog = this.toggleDialog.bind(this);
  }

  toggleDialog() {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  }

  render() {
    const { buttonProps, ButtonComponent = Button, children, Dialog, dialogProps } = this.props;

    return (
      <>
        <ButtonComponent onClick={this.toggleDialog} {...buttonProps}>{children}</ButtonComponent>
        <Dialog
          isOpen={this.state.isOpen}
          toggleDialog={this.toggleDialog}
          {...dialogProps}
        />
      </>
    );
  }
}

export default DialogToggleButton;
