import React from 'react';
import { connect } from 'react-redux';
import { FormattedNumber } from 'react-intl';
import { Link } from 'react-router-dom';

import Schema from 'src/components/common/Schema';

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
                  <Link to={`/search?filter:collection_id=${collection.id}&filter:schema=${item.name}`}>
                <Schema.Label schema={item.name} icon={true} plural={true}/>
                    </Link>
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
