{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React, { Component } from 'react';

import ErrorSection from './ErrorSection'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error) {
    this.setState({ error });
  }

  render() {
    const { children, errorTitle } = this.props;

    if (!!this.state.error) {
      return (
        <ErrorSection
          title={errorTitle}
          description={this.state.error.toString()}
        />
      )
    }
    return children;
  }
}

export default ErrorBoundary;
