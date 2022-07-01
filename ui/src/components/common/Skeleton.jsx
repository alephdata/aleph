import React, { PureComponent } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

class TextSkeleton extends PureComponent {
  render() {
    const { className, length, type } = this.props;
    const placeholder = '-'.repeat(length);

    return React.createElement(
      type,
      { className: c(Classes.SKELETON, className) },
      placeholder
    );
  }
}

class Skeleton {
  static Text = TextSkeleton;
}

export default Skeleton;
