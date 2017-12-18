import React, { Component } from 'react';
import { FormattedMessage, FormattedDate } from 'react-intl';

class CollectionSection extends Component {
  render() {
    const { label, summary, updated_at } = this.props.collection;
    return (
      <div>
        <h3>
            <FormattedMessage id="collection.section" defaultMessage="Origin"/>
        </h3>
        <strong>{ label }</strong>
        <p>{ summary }</p>
        <p><FormattedDate value={updated_at} /></p>
      </div>
    );
  }
}

export default CollectionSection;
