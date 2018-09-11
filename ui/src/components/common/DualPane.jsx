import React, { Component } from 'react';
import c from 'classnames';

import './DualPane.css';
import ViewsMenu from "../ViewsMenu/ViewsMenu";

class InfoPane extends Component {
  render() {
    const { children, className } = this.props;
    return (
      <aside className={`InfoPane ${className}`} style={this.props.style}>
        {children}
      </aside>
    );
  }
}

class SidePane extends Component {
  render() {
    const { children, className } = this.props;
    return (
      <aside className={`SidePane ${className}`} style={this.props.style}>
        {children}
      </aside>
    );
  }
}

class ContentPane extends Component {
  render() {
    const { children, className = '' } = this.props;
    return (
      <main className={c('ContentPane', className)} style={this.props.style}>
        {children}
      </main>
    );
  }
}

class DualPane extends Component {
  static InfoPane = InfoPane;
  static SidePane = SidePane;
  static ContentPane = ContentPane;

  render() {
    const { children, className } = this.props;

    return (
      <article className={c("DualPane", className)}>
        { children }
      </article>
    );
  }

}

export default DualPane;
