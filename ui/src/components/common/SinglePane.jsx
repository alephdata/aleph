// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import c from 'classnames';

import './SinglePane.scss';


class SinglePane extends PureComponent {
  render() {
    const { children, className } = this.props;
    return (
      <article className={c('SinglePane', className)}>
        { children }
      </article>
    );
  }
}

export default SinglePane;
