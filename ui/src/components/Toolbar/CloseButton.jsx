import React from 'react';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { Button } from '@blueprintjs/core';


class CloseButton extends React.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
  }
  
  close() {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash['preview:id'] = undefined;
    parsedHash['preview:type'] = undefined;
    parsedHash['preview:mode'] = undefined;
    parsedHash['page'] = undefined;
    parsedHash['mode'] = undefined;
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    })
  }
  
  render() {
    return (
      <Button className="bp3-minimal button-close" icon="cross" onClick={this.close}/>
    );
  }
}

CloseButton = withRouter(CloseButton);
export default CloseButton