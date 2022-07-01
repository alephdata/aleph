import React, { PureComponent } from 'react';

import './QueryText.scss';

class QueryText extends PureComponent {
  render() {
    const { query } = this.props;
    return <span className="QueryText">{query}</span>;
  }
}

export default QueryText;
