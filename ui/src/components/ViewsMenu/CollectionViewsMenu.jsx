import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';

import ViewItem from "src/components/ViewsMenu/ViewItem";
import { selectCollectionXrefIndex } from 'src/selectors';
import { Tabs, Tab } from '@blueprintjs/core';

import CollectionMetadata from "src/components/Collection/CollectionMetadata";
import CollectionXrefIndexMode from 'src/components/Collection/CollectionXrefIndexMode';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';

import './ViewsMenu.css';
import queryString from "query-string";

const messages = defineMessages({
  info: {
    id: 'document.mode.text.info',
    defaultMessage: 'Overview',
  },
  documents: {
    id: 'document.mode.text.documents',
    defaultMessage: 'Browse as a folder',
  },
  xref: {
    id: 'document.mode.text.xref',
    defaultMessage: 'Cross-reference',
  }
});


class CollectionViewsMenu extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      mode: props.activeMode
    };

    this.handleTabChange = this.handleTabChange.bind(this);
  }
  
  countDocuments() {
    // FIXME: give better metadata from API.
    const docTypes = ['Document', 'Pages', 'Folder', 'Package', 'Email', 'HyperText', 'Workbook', 'Table', 'PlainText', 'Image', 'Video', 'Audio'];
    const { collection } = this.props;
    const { schemata } = collection;
    let totalCount = 0;
    for (let key in schemata) {
      if (docTypes.indexOf(key) !== -1) {
        totalCount += schemata[key];
      }
    }
    return totalCount;
  }

  handleTabChange(mode) {
    const { history, location, isPreview } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if(isPreview) {
      parsedHash['preview:mode'] = mode;
    } else {
      parsedHash['mode'] = mode;
    }

    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
    this.setState({mode: mode});
  }

  render() {
    const { intl, isPreview, collection, activeMode } = this.props;
    const { xrefIndex } = this.props;
    const { mode } = this.state;
    const numOfDocs = this.countDocuments();
    // TODO: add case home page / timeline....

    return (
      <Tabs id="EntityInfoTabs" onChange={this.handleTabChange} selectedTabId={mode} className='info-tabs-padding'>
        {isPreview && (<Tab id="info"
                            title={
                              <React.Fragment>
                                <FormattedMessage id="entity.info.overview" defaultMessage="Overview"/>
                              </React.Fragment>
                            }
                            panel={
                              <CollectionMetadata collection={collection} />
                            }
        />)}
        <Tab id="documents"
             disabled={numOfDocs === 0}
                               title={
                                 <React.Fragment>
                                   <FormattedMessage id="entity.info.source" defaultMessage="Browse as a folder"/>
                                   <span> ({numOfDocs !== 0 ? numOfDocs : 0})</span>
                                 </React.Fragment>
                               }
                               panel={
                                 <CollectionDocumentsMode collection={collection} />
                               }
        />
        <Tab id="xref"
                              title={
                                <React.Fragment>
                                  <FormattedMessage id="entity.info.overview" defaultMessage="Cross-reference"/>
                                </React.Fragment>
                              }
                              panel={
                                <CollectionXrefIndexMode collection={collection} />
                              }
        />
      </Tabs>
    );

    /*return (
      <div className="ViewsMenu">
        {isPreview && (
          <ViewItem mode='info'
                    activeMode={activeMode}
                    isPreview={isPreview}
                    message={intl.formatMessage(messages.info)}
                    icon='fa-info' />
        )}
        <ViewItem mode='documents'
                  activeMode={activeMode}
                  isPreview={isPreview}
                  count={this.countDocuments()}
                  message={intl.formatMessage(messages.documents)}
                  href={`/collections/${collection.id}/documents`}
                  icon='fa-folder-open' />
        <ViewItem mode='xref' activeMode={activeMode}
                  isPreview={isPreview}
                  count={xrefIndex.total}
                  message={intl.formatMessage(messages.xref)}
                  href={`/collections/${collection.id}/xref`}
                  icon='fa-folder-open' />
      </div>
    );*/
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return {
    xrefIndex: selectCollectionXrefIndex(state, collection.id)
  };
};

CollectionViewsMenu = connect(mapStateToProps, {})(CollectionViewsMenu);
CollectionViewsMenu = injectIntl(CollectionViewsMenu);
CollectionViewsMenu = withRouter(CollectionViewsMenu);
export default CollectionViewsMenu;