/*
 * @TODO This has gotten a bit large and there is some scope for refactoring.
 * Moving some of the logic out of the render and into componentWillReceiveProps
 * would be a good idea. This might require some extra state options though.
 */
import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';
import classnames from 'classnames';
import {defineMessages, injectIntl} from "react-intl";

import Fragment from 'src/app/Fragment';
import { fetchCollection, fetchEntity, fetchDocument } from 'src/actions';
import CollectionInfo from 'src/screens/CollectionScreen/CollectionInfo';
import DocumentInfo from 'src/screens/DocumentScreen/DocumentInfo';
import { DocumentViewer } from 'src/components/DocumentViewer';
import EntityInfo from 'src/screens/EntityScreen/EntityInfo';
import SectionLoading from 'src/components/common/SectionLoading';
import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';

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
  document: null
};

const messages = defineMessages({
  not_found: {
    id: 'preview.not_found',
    defaultMessage: 'Source not found',
  },
  not_authorized: {
    id: 'preview.not_auth',
    defaultMessage: 'You are not authorized to do this.',
  },
  not_authorized_decr: {
    id: 'preview.not_auth_decr',
    defaultMessage: 'Please go to the login page.',
  }
});

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
        maximised = (parsedHash['preview:maximised'] === 'true');
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
    
    let className = 'Preview';

    let view = null;

    
    if (previewType === 'collection' && collection && collection.links && !collection.isFetching) {      
      view = <CollectionInfo collection={collection} showToolbar={true} />;
    } else if (previewType === 'entity' && entity && entity.links && !entity.isFetching) {
      view = <EntityInfo entity={entity}  showToolbar={true} />;
    } else if (previewType === 'document') {
      if (doc && doc.links && !doc.isFetching) {
        if (maximised === true) {
          // Only allow Preview to have be maximised for document previews
          className = classnames('maximised', className);
          // If document preview is maximised, show document content preview
          view = <DocumentViewer document={doc} toggleMaximise={this.toggleMaximise} showToolbar={true} previewMode={true} />;
        } else {
          // If document preview is not maximised, show document info
          view = <DocumentInfo document={doc} toggleMaximise={this.toggleMaximise} showToolbar={true} />;
        }
      }
    }
    if (view !== null) {
      // If we have a document and it's ready to render display it
      return (
        <div id="Preview" className={className} style={{
          top: previewTop,
          bottom: previewBottom
          }}>
          {view}
        </div>
      );
    } else if (previewId !== null && (collection === null || collection.error === undefined)) {
      // Handle when we have an element to load but it's not ready to render yet
      return (
        <div id="Preview" className={classnames('loading', className)} style={{
          top: previewTop,
          bottom: previewBottom
          }}>
          <SectionLoading/>
        </div>
      );
    } else if(collection !== null && collection !== null && collection.error === 'You are not authorized to do this.'){
      return <div id="Preview" className={className} style={{
        top: previewTop,
        bottom: previewBottom
      }}>
        <ErrorScreen.LinkDescription title={messages.not_authorized} description={messages.not_authorized_decr}/>
      </div>
    } else if(collection !== null && collection.error){
      return <div id="Preview" className={className} style={{
        top: previewTop,
        bottom: previewBottom
      }}>
        <ErrorScreen.EmptyList title={messages.not_found}/>
      </div>
    } else {
      // Handle if we have no element to display - renders hidden (0px width)
      // Note: We don't return null as we want a hide animation to happen!
      return (
        <div id="Preview" className={classnames('hidden', className)} style={{
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
    } else if (previewType === 'entity' && state.entities[previewId]) {
      entity = state.entities[previewId];
    } else if (previewType === 'document' && state.entities[previewId]) {
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
Preview = injectIntl(Preview);

export default Preview;