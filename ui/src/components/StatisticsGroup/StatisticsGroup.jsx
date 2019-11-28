import React, { PureComponent } from 'react';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import {
  FormattedMessage, FormattedNumber,
} from 'react-intl';
import {
  Category, Country, Schema, Numeric, SinglePane,
} from 'src/components/common';
import Statistics from './Statistics';

import './StatisticsGroup.scss';


class StatisticsGroup extends PureComponent {
  render() {
    const { statistics } = this.props;
    return (
      <SinglePane className="StatisticsGroup">
        <Statistics
          styleType="light"
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
            <Link to={`/search?filter:schema=${props.name}`} schema={props.name} {...props}>
              <div className="inner-container">
                <span className="label">
                  <Schema.Smart.Label schema={props.name} {...props} />
                </span>
                <span className="value">
                  <Numeric num={props.count} />
                </span>
              </div>
            </Link>
          )}
        />
        <Statistics
          styleType="light"
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
              <div className="inner-container">
                <span className="label">
                  <Category.Label category={props.name} />
                </span>
                <span className="value">
                  <Numeric num={props.count} />
                </span>
              </div>
            </Link>
          )}
        />
        <Statistics
          styleType="light"
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
              <div className="inner-container">
                <span className="label">
                  <Country.Name {...props} code={props.name} />
                </span>
                <span className="value">
                  <Numeric num={props.count} />
                </span>
              </div>
            </Link>
          )}
        />
      </SinglePane>
    );
  }
}

export default StatisticsGroup;
