import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import { Card } from '@blueprintjs/core';
import { Numeric } from 'src/components/common';


import './CollectionStatistics.scss';

class CollectionStatistics extends PureComponent {
  render() {
    const { title, statistics, intl } = this.props;
    const { icon, label } = title;

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
                  <span className="category">{key}</span>
                  <span className="count"><Numeric num={value} /></span>
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
