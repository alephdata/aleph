import React, { PureComponent } from 'react';
import { Icon } from '@blueprintjs/core';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import Truncate from 'react-truncate';
import c from 'classnames';

// formats markdown elements to plain text
const simpleRenderer = ({ children }) => (
  <>
    <span>{children}</span>
    <span> </span>
  </>
);

class DiagramLabel extends PureComponent {
  render() {
    const { diagram } = this.props;
    if (!diagram || !diagram.id) {
      return null;
    }

    return (
      <span className="DiagramLabel" title={diagram.label}>
        <Icon icon="graph" className="left-icon" />
        <span>{diagram.label}</span>
      </span>
    );
  }
}

const DiagramSummary = ({ className, diagram, truncate }) => {
  const content = (
    <ReactMarkdown
      skipHtml
      linkTarget="_blank"
      renderers={truncate ? { paragraph: simpleRenderer, listItem: simpleRenderer } : {}}
    >
      { diagram.summary }
    </ReactMarkdown>
  );

  return (
    <div className={c(className, 'bp3-running-text bp3-text-muted text-markdown')}>
      {truncate && <Truncate lines={truncate}>{content}</Truncate>}
      {!truncate && content}
    </div>
  );
};


class DiagramLink extends PureComponent {
  render() {
    const { diagram, className } = this.props;
    const link = `/diagrams/${diagram.id}`;
    const content = <Diagram.Label {...this.props} />;

    return <Link to={link} className={c('DiagramLink', className)}>{content}</Link>;
  }
}

class Diagram {
  static Label = DiagramLabel;

  static Summary = DiagramSummary;

  static Link = withRouter(DiagramLink);
}

export default Diagram;
