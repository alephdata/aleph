import React, { PureComponent } from 'react';
import { FormattedNumber, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Card } from '@blueprintjs/core';
import {
  Schema,
} from 'src/components/common';


import './CollectionStatistics.scss';

class CollectionStatistics extends PureComponent {
  renderItemLink(field, key) {
    const { collection } = this.props;
    if (field === 'schema') {
      return (
        <Schema.Smart.Link
          schema={key}
          plural
          url={`/search?filter:collection_id=${collection.id}&filter:schema=${key}`}
        />
      );
    }
    return (
      <Link to={`/search?filter:collection_id=${collection.id}&filter:${field}=${key}`}>
        {key}
      </Link>
    );
  }

  render() {
    const { title, statistics, intl } = this.props;
    const { field, icon, label } = title;

    const list = Object.entries(statistics).sort((a, b) => (
      a[1] < b[1] ? 1 : -1
    ));


    return (
      <div className="CollectionStatistics">
        <Card className="CollectionStatistics__inner-container">
          <h6 className="CollectionStatistics__title bp3-heading">
            <span className={`bp3-icon bp3-icon-${icon} left-icon`} />
            {intl.formatMessage(label)}
          </h6>
          <div className="">
            <ul className="info-rank">
              {list.map(([key, value]) => (
                <li className="CollectionStatistics__value" key={key}>
                  <span className="category">
                    {this.renderItemLink(field, key)}
                  </span>
                  <span className="count">
                    <FormattedNumber value={value} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    );
  }
}

export default injectIntl(CollectionStatistics);
