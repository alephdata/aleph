import React, { PureComponent } from 'react';
import { Tag } from '@blueprintjs/core';
import { connect } from 'react-redux';

import { selectMetadata } from 'selectors';

class FrequencyLabel extends PureComponent {
  render() {
    const { frequency, frequencies } = this.props;
    const label = frequencies[frequency];
    return (
      <span className="FrequencyLabel">
        <Tag icon="automatic-updates" title={label}>
          {label}
        </Tag>
      </span>
    );
  }
}

const mapStateToProps = (state) => ({
  frequencies: selectMetadata(state).frequencies,
});

class Frequency {
  static Label = connect(mapStateToProps)(FrequencyLabel);
}

export default Frequency;
