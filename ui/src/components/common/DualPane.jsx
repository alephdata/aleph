import React, { PureComponent } from 'react';
import c from 'classnames';

import './DualPane.scss';


class InfoPane extends PureComponent {
  render() {
    const { children, className } = this.props;
    return (
      <aside className={c('InfoPane', className)} style={this.props.style}>
        {children}
      </aside>
    );
  }
}

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
  static InfoPane = InfoPane;

  static SidePane = SidePane;

  static ContentPane = ContentPane;

  render() {
    const { children, className, ...restProps } = this.props;
    return (
      <article {...restProps} className={c('DualPane', className)}>
        { children }
      </article>
    );
  }
}

export default DualPane;
