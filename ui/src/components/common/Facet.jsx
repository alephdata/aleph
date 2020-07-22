import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import { Icon } from '@blueprintjs/core';
import getFacetConfig from 'util/getFacetConfig';


class FacetLabel extends PureComponent {
  render() {
    const { field, intl, count = 0 } = this.props;
    const config = getFacetConfig(field);
    if (!field || !config) {
      return null;
    }
    const { icon, label } = config;

    return (
      <>
        <Icon icon={icon} className="left-icon" />
        {intl.formatMessage(label, { count })}
      </>
    );
  }
}

class Facet {
  static Label = injectIntl(FacetLabel);
}

export default Facet;
