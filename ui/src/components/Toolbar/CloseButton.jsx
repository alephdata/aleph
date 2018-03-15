import React from 'react';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Button } from '@blueprintjs/core';

class CloseButton extends React.Component {
  render() {
    const { location: loc } = this.props;
    return (
      <Link to={loc.pathname + loc.search} className="button-close">
        <Button className="pt-minimal" icon="cross"/>
      </Link>
    );
  }
}

CloseButton = withRouter(CloseButton);

export default CloseButton