import React, { PureComponent } from 'react';
import { min } from 'lodash';
import { FormattedDate, FormattedTime } from 'react-intl';

class Earliest extends PureComponent {
  render() {
    const earliest = min(this.props.values);
    return <Date value={earliest} />;
  }
}


class Date extends PureComponent {
  static Earliest = Earliest;

  render() {
    const { value: dateString, showTime } = this.props;
    if (!dateString) {
      return null;
    }
    const availableChunks = dateString.split(/-/);
    const dateObject = Reflect.construct(window.Date, [dateString]);
    return (
      <React.Fragment>
        <FormattedDate
          value={dateObject}
          year="numeric"
          month={availableChunks[1] && 'long'}
          day={availableChunks[2] && 'numeric'}
        />
        {showTime && <FormattedTime value={dateObject} />}
      </React.Fragment>
    );
  }
}

export default Date;
