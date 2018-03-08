import React from 'react';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { Button } from '@blueprintjs/core';

import getPath from 'src/util/getPath';
import { fetchCollection } from 'src/actions';
import CollectionInfo from 'src/components/CollectionScreen/CollectionInfo';
import SectionLoading from 'src/components/common/SectionLoading';

import './Preview.css';

const defaultState = {
  maximised: false,
  previewTop: 0,
  previewBottom: 0,
  previewId: null,
  previewType: null,
  previewTab: null,
  collection: null
}

class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.state = defaultState;
    this.state.collection = props.collection || null;
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    this.handleScroll();
  }
  
  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }
  
  componentWillReceiveProps(newProps) {
    // Storing the collection in state rather than using the prop value
    // so we can control rendering behaviour (this is a work in progress)
    if (newProps.collection) {
      this.setState({ collection: newProps.collection })
    }
  }

  async componentDidUpdate(prevProps) {
    const parsedHash = queryString.parse(this.props.location.hash);
    if (parsedHash['preview:id'] && parsedHash['preview:type']) {
      // If passed a 
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
    
    if (previewTop === this.state.previewTop)
      return;
    
    this.setState({
      previewTop: previewTop,
      previewBottom: previewBottom
    })
  }
  
  render() {
    const { previewId,
            previewType,
            previewTop,
            previewBottom,
            maximised,
            collection
          } = this.state;
    
    let className = 'Preview'
    
    if (maximised === true)
      className += ' maximised'
      
    if (previewType === 'collection' && collection && !collection.isFetching) {
      // If we have a collection and it's ready to render
      return (
        <div className={className} style={{
          top: previewTop,
          bottom: previewBottom
          }}>
          <div className="toolbar">
            <Button
              icon={(maximised) ? 'double-chevron-right' : 'double-chevron-left'}
              className={`button-maximise ${(maximised) ? 'pt-active' : ''}`}
              onClick={ () => { this.setState({maximised: !maximised})} }
            />
          
            <Link to={getPath(collection.links.ui)} className="pt-button button-link">
              <span className="pt-icon-folder-open"/>
            </Link>
          
            <Link to={this.props.location.pathname + this.props.location.search}>
              <span className="pt-icon-cross button-close pt-button pt-minimal"/>
            </Link>
          </div>
          <CollectionInfo collection={collection} />
        </div>
      );
    } else if (previewId !== null) {
      // If we have an element to load but it's not ready to render yet
      // (We could add a loading spinner if we want.)
      className += ' loading'
      return (
        <div className={className} style={{
          top: previewTop,
          bottom: previewBottom
          }}>
          <SectionLoading/>
        </div>
      );
    } else {
      // If we have no element to display, don't render
      className += ' hidden'
      return (
        <div className={className} style={{
          top: previewTop,
          bottom: previewBottom
          }} />
        )
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  const parsedHash = queryString.parse(ownProps.location.hash);
  let collection = null
  
  if (parsedHash['preview:id'] &&
      parsedHash['preview:type'] && 
      parsedHash['preview:type'] === 'collection'
      && state.collections[parsedHash['preview:id']]) {
      collection = state.collections[parsedHash['preview:id']];
  }
  return {
    collection: collection
  };
};

Preview = connect(mapStateToProps, {
  fetchCollection
})(Preview);

Preview = withRouter(Preview);

export default Preview;