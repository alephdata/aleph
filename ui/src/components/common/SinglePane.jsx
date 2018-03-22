import React, { Component } from 'react';
import c from 'classnames';

import './SinglePane.css';

class ContentPane extends Component {
  render() {
    const { children, className, limitedWidth } = this.props;
    return (
      <main className={c('ContentPane', { 'limited-width': limitedWidth }, className)} style={this.props.style}>
        {children}
      </main>
    );
  }
}

class SinglePane extends Component {
  static ContentPane = ContentPane;

  render() {
    const { children, className, limitedWidth } = this.props;

    return (
      <article className={c("SinglePane", className)}>
        <ContentPane limitedWidth={limitedWidth}>
          { children }
        </ContentPane>
      </article>
    );
  }

}

export default SinglePane;
