import { PureComponent } from 'react';
import filesize from 'filesize';

interface IFileSizeProps {
  value: number;
}

class FileSize extends PureComponent<IFileSizeProps> {
  render() {
    const { value } = this.props;
    if (!value) {
      return null;
    }
    return filesize(value, { round: 0 });
  }
}

export default FileSize;
