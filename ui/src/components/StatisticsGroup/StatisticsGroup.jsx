import React, { PureComponent } from 'react';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import {
  FormattedMessage, FormattedNumber,
} from 'react-intl';
import {
  Category, Country, Schema, Numeric, DualPane,
} from 'src/components/common';
import Statistics from './Statistics';

import './StatisticsGroup.scss';


class StatisticsGroup extends PureComponent {
  render() {
    const { statistics } = this.props;
    return (
      <DualPane className="StatisticsGroup">
        <Statistics
          headline={(
            <FormattedMessage
              id="home.statistics.schemata"
              defaultMessage="Search {things} entities"
              values={{
                things: <Numeric num={statistics.things} abbr />,
              }}
            />
          )}
          seeMoreButtonText={restCount => (
            <FormattedMessage
              id="home.statistics.othertypes"
              defaultMessage="{count} more entity types"
              values={{
                count: restCount,
              }}
            />
          )}
          statistic={statistics.schemata}
          isLoading={!statistics.schemata}
          ItemContentContainer={props => (
            <Schema.Smart.Link url={`/search?filter:schema=${props.name}`} schema={props.name} {...props}>
              <Numeric num={props.count} />
            </Schema.Smart.Link>
          )}
        />
        <Statistics
          headline={(
            <FormattedMessage
              id="home.statistics.categories"
              defaultMessage="from {collections} datasets"
              values={{
                collections: <FormattedNumber value={statistics.collections || 0} />,
              }}
            />
          )}
          seeMoreButtonText={restCount => (
            <FormattedMessage
              id="home.statistics.other"
              defaultMessage="{count} more datasets"
              values={{
                count: restCount,
              }}
            />
          )}
          statistic={statistics.categories}
          isLoading={!statistics.categories}
          ItemContentContainer={props => (
            <Link
              to={`/datasets?collectionsfilter:category=${props.name}`}
            >
              <Category.Label category={props.name} />
              <Numeric num={props.count} />
            </Link>
          )}
        />
        <Statistics
          headline={(
            <FormattedMessage
              id="home.statistics.countries"
              defaultMessage="in {count} countries"
              values={{
                count: _.size(statistics.countries),
              }}
            />
          )}
          seeMoreButtonText={restCount => (
            <FormattedMessage
              id="home.statistics.territories"
              defaultMessage="{count} more countries & territories"
              values={{
                count: restCount,
              }}
            />
          )}
          statistic={statistics.countries}
          isLoading={!statistics.countries}
          ItemContentContainer={props => (
            <Link to={`/datasets?collectionsfilter:countries=${props.name}`}>
              <Country.Name {...props} code={props.name} />
              <Numeric num={props.count} />
            </Link>
          )}
        />
      </DualPane>
    );
  }
}

export default StatisticsGroup;
