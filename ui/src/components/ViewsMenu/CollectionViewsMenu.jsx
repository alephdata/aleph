import React from 'react';
import { withRouter } from 'react-router';
import { connect } from "react-redux";
import { injectIntl, defineMessages } from 'react-intl';
import c from 'classnames';
import { Tooltip, Position } from '@blueprintjs/core';

import { fetchCollectionXrefIndex } from "src/actions";
import { selectCollectionXrefIndex } from "src/selectors";
import getPath from "src/util/getPath";

import './ViewsMenu.css';

const messages = defineMessages({
  open: {
    id: 'document.mode.text.open',
    defaultMessage: 'Browse as a folder',
  }
});

class CollectionViewsMenu extends React.Component {
  constructor(props) {
    super(props);

    this.openAsFolder = this.openAsFolder.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const {collection, xrefIndex} = this.props;
    if (collection.id !== undefined && xrefIndex.results === undefined && !xrefIndex.isLoading) {
      this.props.fetchCollectionXrefIndex(collection);
    }
  }

  openAsFolder(event) {
    const {collection, history} = this.props;
    event.preventDefault();

    history.replace({
      pathname: `/collections/${collection.id}/documents`
    })
  }

  render() {
    const {intl, showToolbar, collection, xrefIndex} = this.props;
    let content = [];

    for (let key in collection.schemata) {
      if (collection.schemata.hasOwnProperty(key)) {
        content.push({name: key, number: collection.schemata[ key ]});
      }
    }
    content.sort(this.sortByNumber);
    const linkPath = getPath(collection.links.ui) + '/xref/';

    return (
      <div className='ViewsMenu'>
        {showToolbar && (<Tooltip content={intl.formatMessage(messages.open)} position={Position.BOTTOM_RIGHT}>
          <a onClick={(e) => this.openAsFolder(e)}
             className={c('ModeButtons', 'pt-button pt-large')}>
            <span className={`pt-icon-folder-open`}/>
          </a></Tooltip>)}
        {/*{ xrefIndex.results !== undefined && xrefIndex.results.map((idx) => (
          <a key={idx.collection.id}
             href={`${linkPath}${idx.collection.id}`}
             title={idx.collection.label + ' (' + idx.matches + ')'}>
            <span className="pt-icon-standard pt-icon-tag"/>
          </a>
        ))}*/}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const xrefIndex = selectCollectionXrefIndex(state, ownProps.collection.id);
  return {xrefIndex};
};

CollectionViewsMenu = connect(mapStateToProps, {fetchCollectionXrefIndex})(CollectionViewsMenu);
CollectionViewsMenu = injectIntl(CollectionViewsMenu);
CollectionViewsMenu = withRouter(CollectionViewsMenu);
export default CollectionViewsMenu;