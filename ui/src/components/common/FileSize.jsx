import { Component } from 'react';
import filesize from 'filesize';


class FileSize extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }

  render() {
    const { value } = this.props;
    if (!value) {
      return null;
    }
    return filesize(value, {round: 0});
  }
}

export default FileSize;
