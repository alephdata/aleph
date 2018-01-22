import React, { PureComponent } from 'react';

import './DualPane.css';

class InfoPane extends PureComponent {
  render() {
    const { children } = this.props;
    return (
      <aside className="InfoPane">
        <div className="InfoPane-content-container">
          <div className="InfoPane-content">
            {children}
          </div>
        </div>
      </aside>
    );
  }
}

class ContentPane extends PureComponent {
  render() {
    const { children } = this.props;
    return (
      <main className="ContentPane">
        {children}
      </main>
    );
  }
}

class DualPane extends PureComponent {
  static InfoPane = InfoPane;
  static ContentPane = ContentPane;

  render() {
    const { children } = this.props;

    return (
      <article className="DualPane">
        { children }
      </article>
    );
  }

}

export default DualPane;
