import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import { Icon } from '@blueprintjs/core';
import getFacetConfig from 'util/getFacetConfig';


class FacetLabel extends PureComponent {
  render() {
    const { facet, intl, count = 0 } = this.props;
    if (!facet) {
      return null;
    }
    const { icon, isProperty, label } = facet;

    return (
      <>
        <Icon icon={icon || 'info'} className="left-icon" />
        {facet.isProperty ? label : intl.formatMessage(label, { count })}
      </>
    );
  }
}

class Facet {
  static Label = injectIntl(FacetLabel);
}

export default Facet;
