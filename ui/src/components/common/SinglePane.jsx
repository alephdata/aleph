{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


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
