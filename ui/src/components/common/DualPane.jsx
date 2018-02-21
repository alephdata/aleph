import React, { Component } from 'react';
import c from 'classnames';

import './DualPane.css';

class InfoPane extends Component {
  render() {
    const { children, className } = this.props;
    return (
      <aside className={`InfoPane ${className}`} style={this.props.style}>
        <div className="InfoPane-content-container">
          <div className="InfoPane-content">
            {children}
          </div>
        </div>
      </aside>
    );
  }
}

class ContentPane extends Component {
  render() {
    const { children, className, limitedWidth } = this.props;
    return (
      <main className={c('ContentPane', { limitedWidth: limitedWidth }, className)} style={this.props.style}>
        {children}
      </main>
    );
  }
}

class DualPane extends Component {
  static InfoPane = InfoPane;
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
