import React, { Component, PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Icon } from '@blueprintjs/core';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import c from 'classnames';

import getCategoryLink from 'src/util/getCategoryLink';
import { selectMetadata } from 'src/selectors';

import './Category.scss';


class CategoryLabel extends Component {
  shouldComponentUpdate(nextProps) {
    const {
      collection = {},
      category = collection.category,
    } = this.props;
    const {
      category: nextCategory = nextProps.collection.category,
    } = nextProps;
    return category !== nextCategory;
  }

  render() {
    const { collection, categories, category: pureCategory, icon } = this.props;

    console.log('rendering category', category);

    const category = collection ? collection.category : pureCategory;
    const label = categories[category] || <FormattedMessage id="category.other" defaultMessage="Other" />;
    return (
      <span className="CategoryLabel" title={label}>
        { icon && (<Icon icon="list" />)}
        <span>{ label }</span>
      </span>
    );
  }
}

class CategoryLink extends PureComponent {
  render() {
    const { collection, className } = this.props;
    if (collection === undefined || collection.category === undefined) {
      return <Category.Label collection={collection} />;
    }
    return (
      <Link to={getCategoryLink(collection)} className={c('CategoryLink', className)}>
        <Category.Label {...this.props} />
      </Link>
    );
  }
}

const mapStateToProps = state => ({
  categories: selectMetadata(state).categories,
});

class Category {
  static Label = connect(mapStateToProps)(CategoryLabel);

  static Link = connect(mapStateToProps)(CategoryLink);
}

export default Category;
