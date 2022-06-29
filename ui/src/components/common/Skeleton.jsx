{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


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
