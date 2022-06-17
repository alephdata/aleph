// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
