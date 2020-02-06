import React, { PureComponent } from 'react';
import { Icon } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import c from 'classnames';
import getDiagramLink from 'src/util/getDiagramLink';


class DiagramLabel extends PureComponent {
  render() {
    const { diagram, icon } = this.props;
    if (!diagram || !diagram.id) {
      return null;
    }

    return (
      <span className="DiagramLabel" title={diagram.label}>
        {icon && <Icon icon="graph" className="left-icon" />}
        <span>{diagram.label}</span>
      </span>
    );
  }
}

class DiagramLink extends PureComponent {
  render() {
    const { diagram, className } = this.props;
    const content = <Diagram.Label {...this.props} />;

    return <Link to={getDiagramLink(diagram)} className={c('DiagramLink', className)}>{content}</Link>;
  }
}

class Diagram {
  static Label = DiagramLabel;

  static Link = withRouter(DiagramLink);
}

export default Diagram;
