import React, { PureComponent } from 'react';
import c from 'classnames';
import { Link } from 'react-router-dom';
import { Numeric, Skeleton } from 'components/common';

import { Button } from '@blueprintjs/core';

import './Statistics.scss';

class Statistics extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      listLen: 15,
    };
    this.onExpand = this.onExpand.bind(this);
  }

  onExpand() {
    const expandIncrement = 30;
    this.setState(prevState => ({ listLen: prevState.listLen + expandIncrement }));
  }

  renderItem = (item) => {
    const { itemLink, itemLabel } = this.props;
    const [ name, count ] = item;
    const label = itemLabel(name);

    return (
      <li key={name} className="Statistics__list-item">
        <Link to={itemLink(name)}>
          <div className="inner-container">
            <span className="label">{label}</span>
            <span className="value">
              <Numeric num={count} />
            </span>
          </div>
        </Link>
      </li>
    );
  }

  renderListSkeleton = () => {
    const { listLen } = this.state;
    const skeletonItems = [...Array(listLen).keys()];

    return skeletonItems.map(item => (
      <li key={item} className="Statistics__list-item">
        <div className="inner-container">
          <Skeleton.Text type="span" className="label" length="20" />
          <Skeleton.Text type="span" className="value" length="2" />
        </div>
      </li>
    ));
  }

  renderList = () => {
    const { seeMoreButtonText, statistic } = this.props;
    const { listLen } = this.state;

    const list = Object.entries(statistic).sort((a, b) => a[1] > b[1] ? -1 : 1);
    const trimmedList = seeMoreButtonText ? list.splice(0, listLen) : list;
    const rest = list.length - listLen;
    const showSeeMoreButton = seeMoreButtonText && rest > 0;

    return (
      <>
        {trimmedList.map(this.renderItem)}
        {showSeeMoreButton && (
          <li className="Statistics__list-item">
            <Button
              className="Statistics__more-toggle"
              onClick={this.onExpand}
              text={seeMoreButtonText(rest)}
            />
          </li>
        )}
      </>
    )
  }

  render() {
    const { headline, isPending, styleType } = this.props;
    const content = isPending ? this.renderListSkeleton() : this.renderList();

    return (
      <div className={c('Statistics bp3-callout', styleType)}>
        {headline && (
          <h5 className={c('bp3-heading', 'Statistics__headline', { 'bp3-skeleton': isPending })}>{headline}</h5>
        )}
        <ul className="Statistics__list">
          {content}
        </ul>
      </div>
    );
  }
}

export default Statistics;
