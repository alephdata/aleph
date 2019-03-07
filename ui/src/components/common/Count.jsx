import React, { PureComponent } from 'react';

import { Numeric } from 'src/components/common';

class Count extends PureComponent {
  render() {
    const { count, full = false } = this.props;

    if (count === undefined || count === 0) {
      return null;
    }

    return (
      <span className="bp3-tag bp3-round bp3-intent-primary">
        <Numeric num={count} abbr={!full} />
      </span>
    );
  }
}

export default Count;
