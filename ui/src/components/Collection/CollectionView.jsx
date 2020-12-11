import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Icon } from '@blueprintjs/core';
import collectionViewIds from 'components/Collection/collectionViewIds'


const messages = defineMessages({
  diagrams: {
    id: 'collection.info.diagrams',
    defaultMessage: 'Network diagrams',
  },
  lists: {
    id: 'collection.info.lists',
    defaultMessage: 'Lists',
  },
  xref: {
    id: 'collection.info.xref',
    defaultMessage: 'Cross-reference',
  },
  search: {
    id: 'collection.info.search',
    defaultMessage: 'Search',
  },
  documents: {
    id: 'collection.info.browse',
    defaultMessage: 'Documents',
  },
  entities: {
    id: 'collection.info.entities',
    defaultMessage: 'Entities',
  },
  mappings: {
    id: 'collection.info.mappings',
    defaultMessage: 'Mappings',
  },
  mentions: {
    id: 'collection.info.mentions',
    defaultMessage: 'Mentions',
  },
  overview: {
    id: 'collection.info.overview',
    defaultMessage: 'Overview',
  },
});

const icons = {
  overview: 'grouped-bar-chart',
  documents: 'document',
  entities: 'list-columns',
  xref: 'comparison' ,
  diagrams: 'graph' ,
  mappings: 'new-object' ,
  search: 'search' ,
  lists: 'list' ,
};

const CollectionViewIcon = ({ id, className }) => {
  const icon = icons[id];
  if (!icon) { return null; }
  return <Icon icon={icon} className={className} />
}

class CollectionViewLabel extends PureComponent {
  render() {
    const { icon, id, intl } = this.props;
    if (!id) { return null; }
    const messageKey = messages[id];
    if (!messageKey) { return null; }

    return (
      <>
        {icon && <CollectionViewIcon id={id} className="left-icon" />}
        <span>{intl.formatMessage(messageKey)}</span>
      </>
    );
  }
}

export default class CollectionView {
  static Icon = CollectionViewIcon;
  static Label = injectIntl(CollectionViewLabel);
}
