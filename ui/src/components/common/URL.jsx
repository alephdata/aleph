import React, { PureComponent } from 'react';

import getHost from 'src/util/getHost';

class URL extends PureComponent {
  render() {
    const { value } = this.props;
    if (!value) return null;

    return (
      <a href={value} rel="noopener noreferrer" target='_blank' title={value}>
        <i className="fa fa-fw fa-external-link" aria-hidden="true"/>
        {getHost(value)}
      </a>
    );
  }
}

export default URL;
