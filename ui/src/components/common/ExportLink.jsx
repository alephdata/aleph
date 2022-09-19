import React, { PureComponent } from 'react';
import { Icon } from '@blueprintjs/core';

import './ExportLink.scss';

class ExportLink extends PureComponent {
  render() {
    const { export_, icon } = this.props;

    const label = (
      <span className="ExportLink">
        <Icon icon={icon} className="left-icon" />
        {export_.label}
      </span>
    );

    if (export_?.links?.download) {
      return <a href={export_.links.download}>{label}</a>;
    }
    return label;
  }
}

export default ExportLink;
