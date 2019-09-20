import React, { Component, PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import c from 'classnames';

import getCategoryLink from 'src/util/getCategoryLink';


import { selectMetadata } from 'src/selectors';


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
    const { collection, categories, category: pureCategory } = this.props;
    const category = collection ? collection.category : pureCategory;

    console.log('in category', category, categories);
    return categories[category] || <FormattedMessage id="category.other" defaultMessage="Other" />;
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
        <Category.Label collection={collection} />
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
