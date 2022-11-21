import React from 'react';
import { Icon } from '@blueprintjs/core';
import truncateText from 'truncate';
import { getHost } from 'react-ftm/utils';

import './URL.scss';

interface IURLProps {
  value: string;
  truncate?: number;
  onClick?: (e: React.MouseEvent) => void;
}

class URL extends React.PureComponent<IURLProps> {
  render() {
    const { truncate, value, ...restProps } = this.props;
    if (!value) {
      return null;
    }
    const href = /^https?:\/\//i.test(value) ? value : `//${value}`;
    const label = getHost(value);

    return (
      <a
        {...restProps}
        href={href}
        className="URL"
        rel="noopener noreferrer"
        target="_blank"
        title={value}
      >
        <Icon icon="link" iconSize={14} />
        {truncate ? truncateText(label, truncate) : label}
      </a>
    );
  }
}

export default URL;
