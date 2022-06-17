// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

class TextSkeleton extends PureComponent {
  render() {
    const { className, length, type } = this.props;
    const placeholder = '-'.repeat(length);

    return React.createElement(
      type,
      { className: c(Classes.SKELETON, className) },
      placeholder,
    );
  }
}

class Skeleton {
  static Text = TextSkeleton;
}

export default Skeleton;
