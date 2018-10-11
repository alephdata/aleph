import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Tabs, Tab } from '@blueprintjs/core';
import queryString from "query-string";

import { Count } from 'src/components/common';
import { selectCollectionXrefIndex } from 'src/selectors';
import CollectionMetadata from "src/components/Collection/CollectionMetadata";
import CollectionXrefIndexMode from 'src/components/Collection/CollectionXrefIndexMode';
import CollectionDocumentsMode from 'src/components/Collection/CollectionDocumentsMode';
import TextLoading from "src/components/common/TextLoading";

import './ViewsMenu.css';

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
    const { isPreview, collection } = this.props;
    const { xrefIndex } = this.props;
    const { mode } = this.state;
    const numOfDocs = this.countDocuments();
    // TODO: add case home page / timeline....

    return (
      <Tabs id="EntityInfoTabs" onChange={this.handleTabChange} selectedTabId={mode} className='info-tabs-padding'>
        {isPreview && (
          <Tab id="info"
               title={
                  <React.Fragment>
                    <i className="fa fa-fw fa-info" />
                    <FormattedMessage id="entity.info.info" defaultMessage="Info"/>
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
                  <i className="fa fa-fw fa-folder-open" />
                  <FormattedMessage id="entity.info.source" defaultMessage="Documents"/>
                  <Count count={numOfDocs} />
                </React.Fragment>
              }
              panel={
                <CollectionDocumentsMode collection={collection} />
              }
        />
        <Tab id="xref"
             disabled={xrefIndex.total < 1}
             title={
                <TextLoading children={<React.Fragment>
                  <i className="fa fa-fw fa-folder-open" />
                  <FormattedMessage id="entity.info.xref" defaultMessage="Cross-reference"/>
                  <Count count={xrefIndex.total} />
                </React.Fragment>} loading={xrefIndex.isLoading}/>

              }
              panel={
                <CollectionXrefIndexMode collection={collection} />
              }
        />
      </Tabs>
    );
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