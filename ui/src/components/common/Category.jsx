import { FormattedMessage } from 'react-intl';

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';


class Category extends PureComponent {
  shouldComponentUpdate(nextProps) {
    const { category } = this.props.collection;
    return category !== nextProps.collection.category;
  }

  render() {
    const { collection, categories } = this.props;
    let category = collection ? collection.category : this.props.category;
    const label = categories[category] || <FormattedMessage id="category.other" defaultMessage="Other"/>;
    return (
      <span>{ label }</span>
    );
  }
}

const mapStateToProps = state => ({
  categories: state.metadata.categories,
});

export default connect(mapStateToProps)(Category);
