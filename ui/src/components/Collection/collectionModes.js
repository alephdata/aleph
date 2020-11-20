import React, { PureComponent } from 'react';
import { Icon } from '@blueprintjs/core';

import { defineMessages, injectIntl } from 'react-intl';

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
    defaultMessage: 'Browse documents',
  },
  mappings: {
    id: 'collection.info.mappings',
    defaultMessage: 'Mappings',
  },
  mentions: {
    id: 'collection.info.mentions',
    defaultMessage: 'Mentions',
  },
});

const collectionModes = {
  documents: {
    icon: 'folder-open',
    category: 'docTool'
  },
  entities: {
    collapsed: true,
  },
  search: {
    icon: 'search',
    collapsed: true
  },
  xref: {
    icon: 'comparison',
    collapsed: true,
    category: 'entityTool'
  },
  diagrams: {
    icon: 'graph',
    category: 'entityTool'
  },
  lists: {
    icon: 'list',
    category: 'entityTool'
  },
  mappings: {
    icon: 'new-object',
    category: 'docTool'
  },
  mentions: {
    icon: 'tag',
    category: 'docTool'
  },
}

const CollectionModeIcon = ({ id, className }) => {
  const icon = collectionModes[id]?.icon;
  if (!icon) { return null; }
  return <Icon icon={icon} className={className} />
}

class CollectionModeLabel extends PureComponent {
  render() {
    const { icon, id, intl } = this.props;
    console.log(id);
    if (!id) { return null; }
    const messageKey = messages[id];
    if (!messageKey) { return null; }

    return (
      <>
        {icon && <CollectionModeIcon id={id} className="left-icon" />}
        {intl.formatMessage(messageKey)}
      </>
    );
  }
}

class CollectionMode {
  static Icon = CollectionModeIcon;
  static Label = injectIntl(CollectionModeLabel);
  // static Count = injectIntl(CollectionModeLabel);


  // static Link = withRouter(CollectionLink);
}

const getModesByCategory = (filterCategory) => {
  return Object.entries(collectionModes)
    .filter(([key,{category}]) => filterCategory === category)
    .map(entry => entry[0]);
}

export { CollectionMode, collectionModes, getModesByCategory };
