import React from 'react';
import { connect } from 'react-redux';
import { FormattedNumber } from 'react-intl';

import { Schema } from 'src/components/common';


class CollectionInfoContent extends React.Component {
  constructor() {
    super();
    this.state = {content: []};
    this.objectToList = this.objectToList.bind(this);
  }

  componentDidMount() {
    this.objectToList(this.props.schemata)
  }

  sortByNumber(a,b) {
    if (a.number < b.number)
      return 1;
    if (a.number > b.number)
      return -1;
    return 0;
  }

  objectToList(object) {
    let content = [];

    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        content.push({name: key, number: object[key]});
      }
    }

    content.sort(this.sortByNumber);
    this.setState({content});
  }

  render() {
    const { content } = this.state;
    const { collection } = this.props;

    return (
      <div className="xrefs">
        <ul className="info-rank">
          { content.map((item, index) => (
            <li key={index}>
              <span className="key">
                <Schema.Link schema={item.name} plural={true} url={`/search?filter:collection_id=${collection.id}&filter:schema=${item.name}`}/>
              </span>
              <span className="value">
                <FormattedNumber value={item.number} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
  };
};

export default connect(mapStateToProps)(CollectionInfoContent);
