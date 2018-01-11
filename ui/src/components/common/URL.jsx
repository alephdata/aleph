import React, { Component } from 'react';

import getHost from 'src/util/getHost';

class URL extends Component {
  render() {
    const { value } = this.props;
    if (!value) return null;

    return (
      <a href={value} rel="noopener noreferrer" target='_blank'>
        <i className="fa fa-fw fa-external-link-square" aria-hidden="true"/>
        {getHost(value)}
      </a>
    );
  }
}

export default Date;
