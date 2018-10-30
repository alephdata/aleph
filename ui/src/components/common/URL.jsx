import React, { PureComponent } from 'react';

import getHost from 'src/util/getHost';
import {Icon} from "@blueprintjs/core";

class URL extends PureComponent {
  render() {
    const { value } = this.props;
    if (!value) return null;

    return (
      <a href={value} rel="noopener noreferrer" target='_blank' title={value}>
        <Icon icon="link"/>
        {getHost(value)}
      </a>
    );
  }
}

export default URL;
