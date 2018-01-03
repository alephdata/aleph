import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import Date from 'src/components/common/Date';

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
        <p><Date value={updated_at} /></p>
      </div>
    );
  }
}

export default CollectionSection;
