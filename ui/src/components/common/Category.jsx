import React, { PureComponent } from 'react';
import { Icon } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import c from 'classnames';

import getCategoryLink from 'util/getCategoryLink';
import { selectMetadata } from 'selectors';

import './Category.scss';

class CategoryLabel extends PureComponent {
  render() {
    const { category, categories, icon } = this.props;
    const label = categories[category];
    return (
      <span className="CategoryLabel" title={label}>
        {!!icon && <Icon icon={icon} className="left-icon" />}
        <span>{label}</span>
      </span>
    );
  }
}

class CategoryLink extends PureComponent {
  render() {
    const { category, className } = this.props;
    if (category === undefined) {
      return <Category.Label category={category} />;
    }
    return (
      <Link
        to={getCategoryLink(category)}
        className={c('CategoryLink', className)}
      >
        <Category.Label {...this.props} />
      </Link>
    );
  }
}

const mapStateToProps = (state) => ({
  categories: selectMetadata(state).categories,
});

class Category {
  static Label = connect(mapStateToProps)(CategoryLabel);

  static Link = connect(mapStateToProps)(CategoryLink);
}

export default Category;
