import React, { PureComponent } from 'react';
import _ from 'lodash';
import c from 'classnames';
import { Button, InputGroup } from '@blueprintjs/core';

import './Statistics.scss';

class Statistics extends PureComponent {
  static Item({
    ItemContentContainer = Statistics.ItemContentContainer,
    item: [name, count],
    ...rest
  }) {
    return (
      <li {...rest}>
        <ItemContentContainer name={name} count={count} />
      </li>
    );
  }

  static Noop(props) { return <div key={props.key} className={props.className}>skeleton</div>; }

  constructor(props) {
    super(props);
    this.state = {
      listLen: 15,
      filterVal: '',
    };
    this.onExpand = this.onExpand.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
  }

  onExpand() {
    const expandIncrement = 30;
    this.setState(prevState => ({ listLen: prevState.listLen + expandIncrement }));
  }

  onFilterChange(event) {
    const filterVal = event.target.value;
    this.setState({ filterVal });
  }

  getItemsList() {
    const { hasFilter, isPending, statistic } = this.props;
    const { filterVal } = this.state;
    if (isPending) {
      return Array.from({ length: 40 }, (i, ii) => ([ii]));
    }
    const list = Object.entries(statistic);

    if (hasFilter) {
      return list.filter(([label]) => (
        label.toLowerCase().includes(filterVal.toLowerCase())
      ));
    }

    return list;
  }

  render() {
    const {
      seeMoreButtonText,
      filterPlaceholder,
      hasFilter,
      headline,
      isPending,
      styleType,
      children = isPending ? Statistics.Noop : Statistics.Item,
      ItemContentContainer = Statistics.ItemContentContainer,
    } = this.props;
    const {
      listLen,
      filterVal,
    } = this.state;
    const list = this.getItemsList();

    const rest = list.length - listLen;
    return (
      <div className={c('Statistics bp3-callout', styleType)}>
        <h5 className={c('bp3-heading', 'Statistics__headline', { 'bp3-skeleton': isPending })}>{headline}</h5>
        {hasFilter && (
          <InputGroup
            className="Statistics__filter"
            leftIcon="search"
            placeholder={filterPlaceholder}
            onChange={this.onFilterChange}
            value={filterVal}
          />
        )}
        <ul className="Statistics__list">
          {_.sortBy(list, [1]).splice(-listLen).reverse().map(item => children({
            className: c('Statistics__list-item', { 'bp3-skeleton': isPending }),
            key: item[0],
            item,
            ItemContentContainer,
          }))}
          {rest > 0 && !isPending && (
            <li className={c('Statistics__list-item', { 'bp3-skeleton': isPending })}>
              <Button
                onClick={this.onExpand}
                text={seeMoreButtonText(rest)}
              />
            </li>
          )}
        </ul>
      </div>
    );
  }
}

export default Statistics;
