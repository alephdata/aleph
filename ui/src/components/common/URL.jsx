import React, { PureComponent } from 'react';

import getHost from 'src/util/getHost';
import { Icon } from '@blueprintjs/core';


import './URL.scss';

class URL extends PureComponent {
  render() {
    const { value, ...restProps } = this.props;
    if (!value) {
      return null;
    }

    return (
      <a {...restProps} href={value} className="URL" rel="noopener noreferrer" target="_blank" title={value}>
        <Icon icon="link" iconSize={14} />
        {getHost(value)}
      </a>
    );
  }
}

export default URL;
