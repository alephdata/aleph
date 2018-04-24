import React from 'react';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';

import getPath from 'src/util/getPath';


class ParentButton extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    const { document, location, history } = this.props;
    history.replace({
      pathname: getPath(document.parent.links.ui)
    });
  }

  render() {
    const { document, isPreview } = this.props;
    const className = isPreview === true ? this.props.className : '';

    if (document.parent === undefined || isPreview) {
      return null;
    }

    return (
      <a onClick={this.onClick} className={`ParentButton pt-button ${className}`}>
        <span className="pt-icon-standard pt-icon-folder-open"/>
        <span>
          <FormattedMessage id="document.parent.nav" defaultMessage="Up"/>
        </span>
      </a>
    );
  }
}

ParentButton = withRouter(ParentButton);
export default ParentButton;