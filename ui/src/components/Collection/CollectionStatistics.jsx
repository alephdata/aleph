import React, { PureComponent } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import {
  Numeric,
} from 'src/components/common';
import Statistics from 'src/components/StatisticsGroup/Statistics';


import './CollectionStatistics.scss';

class CollectionStatistics extends PureComponent {
  constructor(props) {
    super(props);

    this.renderItem = this.renderItem.bind(this);
  }

  renderItem({ name, count }) {
    const { collection, title } = this.props;

    return (
      <Link to={`/search?filter:collection_id=${collection.id}&filter:${title.field}=${name}`}>
        {name}
        <Numeric num={count} />
      </Link>
    );
  }

  // renderItemLink(name) {
  //   const { collection, title } = this.props;
  //   // if (title.field === 'schema') {
  //   //   return (
  //   //     <Schema.Smart.Link
  //   //       schema={name}
  //   //       plural
  //   //       url={`/search?filter:collection_id=${collection.id}&filter:schema=${name}`}
  //   //     />
  //   //   );
  //   // }
  //   return (
  //
  //       {name}
  //     </Link>
  //   );
  // }

  render() {
    const { title, statistics, intl } = this.props;
    const { icon, label } = title;

    return (
      <div className="CollectionStatistics">
        <div className="CollectionStatistics__inner-container">
          <Statistics
            headline={(
              <>
                <span className={`bp3-icon bp3-icon-${icon} left-icon`} />
                {intl.formatMessage(label)}
              </>
            )}
            seeMoreButtonText={() => (
              <FormattedMessage
                id="home.statistics.othertypes"
                defaultMessage="Show more"
              />
            )}
            statistic={statistics}
            isLoading={!statistics}
            ItemContentContainer={this.renderItem}
          />
        </div>
      </div>
    );


    // return (
    //   <div className="CollectionStatistics">
    //     <Card className="CollectionStatistics__inner-container">
    //       <h6 className="CollectionStatistics__title bp3-heading">
    //         <span className={`bp3-icon bp3-icon-${icon} left-icon`} />
    //         {intl.formatMessage(label)}
    //       </h6>
    //       <div className="">
    //         <ul className="info-rank">
    //           {list.map(([key, value]) => (
    //             <li className="CollectionStatistics__value" key={key}>
    //               <span className="category">
    //                 {this.renderItemLink(field, key)}
    //               </span>
    //               <span className="count">
    //                 <FormattedNumber value={value} />
    //               </span>
    //             </li>
    //           ))}
    //         </ul>
    //       </div>
    //     </Card>
    //   </div>
    // );
  }
}

export default injectIntl(CollectionStatistics);
