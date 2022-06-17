// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { PureComponent } from 'react';
import c from 'classnames';

import './DualPane.scss';


class SidePane extends PureComponent {
  render() {
    const { children, className } = this.props;
    return (
      <aside className={c('SidePane', className)} style={this.props.style}>
        {children}
      </aside>
    );
  }
}

class ContentPane extends PureComponent {
  render() {
    const { children, className = '' } = this.props;
    return (
      <main className={c('ContentPane', className)} style={this.props.style}>
        {children}
      </main>
    );
  }
}

class DualPane extends PureComponent {
  static SidePane = SidePane;

  static ContentPane = ContentPane;

  render() {
    const { children, className, ...restProps } = this.props;
    return (
      <article {...restProps} className={c('DualPane', className)}>
        <div className="DualPane__inner-container">
          { children }
        </div>
      </article>
    );
  }
}

export default DualPane;
