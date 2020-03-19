import React, { PureComponent } from 'react';
import c from 'classnames';
import { Numeric } from 'src/components/common';

import './Count.scss';

class Count extends PureComponent {
  render() {
    const { count, full = false, className, isPending } = this.props;

    if (!isPending && (count === undefined || count === 0)) {
      return null;
    }

    return (
      <span className={c('Count', 'bp3-tag', 'bp3-small', 'bp3-minimal', 'bp3-round', className)}>
        {isPending && <span>placeholder</span>}
        {!isPending && <Numeric num={count} abbr={!full} />}
      </span>
    );
  }
}

export default Count;
