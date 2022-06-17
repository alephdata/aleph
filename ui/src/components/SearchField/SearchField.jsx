// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import { Icon } from '@blueprintjs/core';

class SearchFieldLabel extends PureComponent {
  render() {
    const { field, icon, intl, count = 0 } = this.props;
    if (!field) {
      return null;
    }
    const { isProperty, label } = field;

    return (
      <>
        {icon && <Icon icon={field.icon || 'filter'} className="left-icon" />}
        {isProperty ? label : intl.formatMessage(label, { count })}
      </>
    );
  }
}

class SearchField {
  static Label = injectIntl(SearchFieldLabel);
}

export default SearchField;
