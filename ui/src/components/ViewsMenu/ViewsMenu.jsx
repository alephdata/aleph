import React from 'react';

import { EntityViewsMenu, CollectionViewsMenu, DocumentViewsMenu } from 'src/components/ViewsMenu/';

class ViewsMenu extends React.Component {

  render() {
    const { type, file } = this.props;

    return (
      <React.Fragment>
        {type === 'entity' && (
          <EntityViewsMenu entity={file}/>
        )}
        {type === 'collection' && (
          <CollectionViewsMenu collection={file} />
        )}
        {type === 'document' && (
          <DocumentViewsMenu document={file}/>
        )}
      </React.Fragment>
    );
  }
}

export default ViewsMenu;