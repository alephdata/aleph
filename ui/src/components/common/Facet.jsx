import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import { Icon } from '@blueprintjs/core';
import getFacetLabel from 'src/util/getFacetLabel';


class FacetLabel extends PureComponent {
  render() {
    const { field, intl, count = 0 } = this.props;
    const labelObject = getFacetLabel(field);
    if (!field || !labelObject) { return null; }
    const { icon, label } = labelObject;

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
