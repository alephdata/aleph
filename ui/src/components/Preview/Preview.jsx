import React from 'react';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import { Button } from '@blueprintjs/core';

import Fragment from 'src/app/Fragment';
import getPath from 'src/util/getPath';
import { fetchCollection, fetchEntity, fetchDocument } from 'src/actions';
import CollectionInfo from 'src/components/CollectionScreen/CollectionInfo';
import DocumentInfo from 'src/screens/DocumentScreen/DocumentInfo';
import { DocumentViewer } from 'src/components/DocumentViewer';
import EntityInfo from 'src/screens/EntityScreen/EntityInfo';
import SectionLoading from 'src/components/common/SectionLoading';
import { Toolbar, CloseButton, DownloadButton, PagingButtons, DocumentSearch } from 'src/components/Toolbar';

import './Preview.css';

const defaultState = {
  maximised: false,
  previewTop: 0,
  previewBottom: 0,
  previewId: null,
  previewType: null,
  previewTab: null,
  collection: null,
  entity: null,
  document: null,
  numberOfPages: 0,
  queryText: ''
}

class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.state = defaultState;
    this.state.maximised = props.maximised || null;
    this.state.collection = props.collection || null;
    this.state.entity = props.entity || null;
    this.state.document = props.document || null;
    this.handleScroll = this.handleScroll.bind(this);
    this.toggleMaximise = this.toggleMaximise.bind(this);
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
    this.onSearchQueryChange = this.onSearchQueryChange.bind(this);
  }

  onDocumentLoad(documentInfo) {
    if (documentInfo) {
      if (documentInfo.numPages) {
        this.setState({
          numberOfPages: documentInfo.numPages
        });
      }
    }
  }

  onSearchQueryChange(queryText) {
    this.setState({
      queryText: queryText
    });
  }
  
  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    this.handleScroll();
  }
  
  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }
  
  componentWillReceiveProps(newProps) {
    // Storing the collection/entities in state rather than using the prop value
    // so we can control rendering behaviour (this is a work in progress)
    if (newProps.collection) {
      this.setState({ collection: newProps.collection })
    }
    if (newProps.entity) {
      this.setState({ entity: newProps.entity })
    }
    if (newProps.document) {
      this.setState({ document: newProps.document })
    }
  }

  async componentDidUpdate(prevProps) {
    const parsedHash = queryString.parse(this.props.location.hash);
    if (parsedHash['preview:id'] && parsedHash['preview:type']) {
      const previewId = parsedHash['preview:id'];
      const previewType = parsedHash['preview:type'];
      const previewTab = parsedHash['preview:tab'] || null;
      
      let maximised = this.state.maximised;
      if (parsedHash['preview:maximised']) {
        maximised = (parsedHash['preview:maximised'] === 'true') ? true : false;
      }
      
      if (this.state.previewId !== previewId ||
          this.state.previewType !== previewType) {
            
        // Redraw view
        this.setState({
            maximised: maximised,
            previewId: previewId,
            previewType: previewType,
            previewTab: previewTab
          },
          () => this.handleScroll()
        );
        
        if (previewType === 'collection')
          this.props.fetchCollection({ id: previewId });

        if (previewType === 'entity')
          this.props.fetchEntity({ id: previewId });

        if (previewType === 'document')
          this.props.fetchDocument({ id: previewId });
      }

      if (this.state.previewTab !== previewTab) {
      // @TODO Handle selecting tab in component (e.g. pass via prop)
      }
    } else {
      // If previewId and previewType not now set but there was previously an
      // item selected, then reset the state to reflect nothing is selected.
      if (this.state.previewId !== null)
        this.setState(defaultState);
    } 
  }

  // @TODO Debounce this callback!
  handleScroll(event) {
    const navbarHeight = document.getElementById('Navbar').getBoundingClientRect().height;
    const footerHeight = document.getElementById('Footer').getBoundingClientRect().height;
    const scrollPos = window.scrollY;
    const previewTop = (scrollPos <= navbarHeight) ? navbarHeight - scrollPos : 0;
    const previewBottom = footerHeight;

    // @EXPERIMENTAL When enabled this adds right padding (equal to the width
    // of the Preview bar) any ContentPane elements on the page.
    // This is a working proof of concept but not intended as a feature yet.
    /*
    if (this.state.reflowContent === true) {
      setTimeout(() => {
        const previewWidth = document.getElementById('Preview').offsetWidth;
        [...document.getElementsByClassName("ContentPane")].forEach(
          (element, index, array) => {
            element.style.paddingRight = `${previewWidth + 20}px`;
          }
        );
      }, 500);
    }
    */
    
    if (previewTop === this.state.previewTop)
      return;
    
    this.setState({
      previewTop: previewTop,
      previewBottom: previewBottom
    })
  }
  
  toggleMaximise() {
    const { fragment } = this.props;
    const newMaximiseState = !this.state.maximised;
    
    fragment.update({'preview:maximised': newMaximiseState });
    
    this.setState({ 
      maximised: newMaximiseState
    })

    // @FIXME: This is a hack to trigger window resize event when displaying
    // a document preview. This forces the PDF viewer to display at the 
    // right size (otherwise it displays at the incorrect height).    
    if (newMaximiseState === true)
      setTimeout(() => {window.dispatchEvent(new Event('resize')) }, 1000);
    
    // @EXPERIMENTAL - Enable if content padding is enabled in handleScroll()
    // this.handleScroll();
  }
  
  render() {
    const { previewId,
            previewType,
            previewTop,
            previewBottom,
            maximised,
            collection,
            entity,
            document: doc
          } = this.state;
    const { numberOfPages } = this.state;
    
    let className = 'Preview'

    let view = null,
        link = null,
        linkIcon = null,
        showQuickPreview = false;
    
    if (previewType === 'collection' && collection && collection.links && !collection.isFetching) {      
      view = <CollectionInfo collection={collection} />;
      link = getPath(collection.links.ui);
      linkIcon = 'folder-open';
    }
    if (previewType === 'entity' && entity && entity.links && !entity.isFetching) {
      view = <EntityInfo entity={entity} />;
      link = getPath(entity.links.ui);
      linkIcon = 'folder-open';
    }
    
    if (previewType === 'document') {
      // Allow quick previews on documents
      showQuickPreview = true;
    
      if (doc && doc.links && !doc.isFetching) {
        view = (maximised === true) ? <DocumentViewer document={doc} queryText={this.state.queryText} onDocumentLoad={this.onDocumentLoad} /> : <DocumentInfo document={doc} />;
        link = getPath(doc.links.ui);
        linkIcon = 'document';
      }
    }
    
    // Only allow Preview to be maximised if Quick Previews are enabled
    if (showQuickPreview === true && maximised === true)
      className += ' maximised'
      
    if (view !== null) {
      // If we have a document and it's ready to render
      return (
        <div id="Preview" className={className} style={{
          top: previewTop,
          bottom: previewBottom
          }}>
          <Toolbar className="color">
            {showQuickPreview === true && (
              <Button icon="eye-open"
                className={`button-maximise ${(maximised) ? 'pt-active' : ''}`}
                onClick={this.toggleMaximise}>
                <FormattedMessage id="preview" defaultMessage="Preview"/>
              </Button>
            )}
            {previewType !== 'collection' && (
              <Link to={link} className="pt-button button-link">
                <span className={`pt-icon-${linkIcon}`}/>
                <FormattedMessage id="sidebar.open" defaultMessage="Open"/>
              </Link>
            )}
            {previewType !== 'collection' && (
              <DownloadButton document={doc}/>
            )}
            {showQuickPreview === true && maximised && (
              <PagingButtons document={doc} numberOfPages={numberOfPages}/>
            )}
            <CloseButton/>
            {showQuickPreview === true && maximised && (
              <DocumentSearch document={doc} queryText={this.state.queryText} onSearchQueryChange={this.onSearchQueryChange}/>
            )}
          </Toolbar>
          {view}
        </div>
      );
  } else if (previewId !== null) {
      // If we have an element to load but it's not ready to render yet
      // (We could add a loading spinner if we want.)
      className += ' loading'
      return (
        <div id="Preview" className={className} style={{
          top: previewTop,
          bottom: previewBottom
          }}>
          <Toolbar className="color">
            <CloseButton/>
          </Toolbar>
          <SectionLoading/>
        </div>
      );
    } else {
      // If we have no element to display, don't render
      className += ' hidden'
      return (
        <div id="Preview" className={className} style={{
          top: previewTop,
          bottom: previewBottom
          }} />
        )
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  const fragment = new Fragment(ownProps.history);
  const parsedHash = queryString.parse(ownProps.location.hash);
  let collection = null,
      entity = null,
      doc = null;
  
  if (parsedHash['preview:id'] && parsedHash['preview:type']) {
    const previewId = parsedHash['preview:id'];
    const previewType = parsedHash['preview:type'];
    
    if (previewType === 'collection' && state.collections[previewId]) {
      collection = state.collections[previewId];
    }
    
    if (previewType === 'entity' && state.entities[previewId]) {
      entity = state.entities[previewId];
    }
    
    if (previewType === 'document' && state.entities[previewId]) {
      doc = state.entities[previewId];
    }
  }
  return {
    collection: collection,
    entity: entity,
    document: doc,
    fragment: fragment
  };
};

Preview = connect(mapStateToProps, {
  fetchCollection,
  fetchEntity,
  fetchDocument
})(Preview);

Preview = withRouter(Preview);

export default Preview;