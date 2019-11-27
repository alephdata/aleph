import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import { Icon } from '@blueprintjs/core';
import getFacetLabel from 'src/util/getFacetLabel';


class FacetLabel extends PureComponent {
  render() {
    const { field, intl } = this.props;
    const { icon, label } = getFacetLabel(field);

    return (
      <>
        <Icon icon={icon} className="left-icon" />
        {intl.formatMessage(label)}
      </>
    );
  }
}

class Facet {
  static Label = injectIntl(FacetLabel);
}

export default Facet;
