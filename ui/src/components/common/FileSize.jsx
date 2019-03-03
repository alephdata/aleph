import { PureComponent } from 'react';
import filesize from 'filesize';


class FileSize extends PureComponent {
  render() {
    const { value } = this.props;
    if (!value) {
      return null;
    }
    return filesize(value, { round: 0 });
  }
}

export default FileSize;
