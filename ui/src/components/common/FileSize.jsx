import React, { PureComponent } from 'react';
import filesize from 'filesize';


class FileSize extends PureComponent {
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }

  render() {
    const { value } = this.props;
    if (!value) {
      return null;
    }

    return (
      <span className='FileSize'>
        { filesize(value, {round: 0}) }
      </span>
    );
  }
}

export default FileSize;
