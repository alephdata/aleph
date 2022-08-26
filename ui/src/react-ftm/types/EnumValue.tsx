import React from 'react';
import { wordList } from 'react-ftm/utils';

interface ILabelProps {
  code: string;
  fullList: Map<string, string>;
  short?: boolean;
}

export class Label extends React.PureComponent<ILabelProps> {
  render() {
    const { code, fullList, short = false } = this.props;
    const codeLabel = code ? code.toUpperCase() : '-';
    const label = short ? codeLabel : fullList.get(code) || codeLabel;

    if (!code) return null;
    return label;
  }
}

interface IListProps {
  codes: string[];
  truncate: number;
  fullList: Map<string, string>;
}

class List extends React.Component<IListProps> {
  render() {
    const { codes, truncate = Infinity, ...props } = this.props;
    if (!codes) return null;

    let names: Array<any> = codes.map((code) => (
      <Label code={code} key={code} {...props} />
    ));

    // Truncate if too long
    if (names.length > truncate) {
      // Cut slightly deeper than requested, as the ellipsis takes space too.
      names = [...names.slice(0, truncate), '…'];
    }
    return wordList(names, ', ');
  }
}

class EnumValue extends React.Component {
  static Label = Label;

  static List = List;
}

export default EnumValue;
