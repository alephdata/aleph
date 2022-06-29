{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React from 'react';
import queryString from 'query-string';
import { Button } from '@blueprintjs/core';

import withRouter from 'app/withRouter'

export class CloseButton extends React.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
  }

  close() {
    const { navigate, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash['preview:id'] = undefined;
    parsedHash['preview:type'] = undefined;
    parsedHash['preview:mode'] = undefined;
    parsedHash.page = undefined;
    navigate({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    return (
      <Button className="bp3-minimal button-close" icon="cross" onClick={this.close} />
    );
  }
}
export default withRouter(CloseButton);
