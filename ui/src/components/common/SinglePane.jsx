import React, { PureComponent } from 'react';
import c from 'classnames';

import './SinglePane.scss';

class SinglePane extends PureComponent {
  render() {
    const { children, className } = this.props;
    return <article className={c('SinglePane', className)}>{children}</article>;
  }
}

export default SinglePane;
