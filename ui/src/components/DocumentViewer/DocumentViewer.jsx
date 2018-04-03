import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Button } from "@blueprintjs/core";
import queryString from 'query-string';


import { Toolbar, CloseButton, DownloadButton, PagingButtons, DocumentSearch } from 'src/components/Toolbar';
import Query from 'src/app/Query';
import getPath from 'src/util/getPath';
import TableViewer from './TableViewer';
import TextViewer from './TextViewer';
import HtmlViewer from './HtmlViewer';
import PdfViewer from './PdfViewer';
import ImageViewer from './ImageViewer';
import FolderViewer from './FolderViewer';
import EmailViewer from './EmailViewer';

class DocumentViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numberOfPages: null,
      queryText: ''
    };
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
    this.onSearchQueryChange = this.onSearchQueryChange.bind(this);
  }
  
  onDocumentLoad(documentInfo) {
    if (documentInfo && documentInfo.numPages) {
      this.setState({
        numberOfPages: documentInfo.numPages
      });
    }
  }

  onSearchQueryChange(queryText) {
    this.setState({
      queryText: queryText
    });
  }
  
  render() {
    const { document: doc, showToolbar, toggleMaximise, previewMode } = this.props;
    const { numberOfPages, queryText } = this.state;
    
    return <React.Fragment>
      {showToolbar && (
        <Toolbar className={(previewMode) ? 'toolbar-preview' : null}>
          {previewMode && toggleMaximise && (
            <Button icon="eye-open"
              className="button-maximise pt-active"
              onClick={toggleMaximise}>
              <FormattedMessage id="preview" defaultMessage="Preview"/>
            </Button>
          )}
          {previewMode && (
            <Link to={getPath(doc.links.ui)} className="pt-button button-link">
              <span className={`pt-icon-document`}/>
              <FormattedMessage id="sidebar.open" defaultMessage="Open"/>
            </Link>
          )}
          <DownloadButton document={doc}/>
          {numberOfPages !== null  && numberOfPages > 0 && (
            <PagingButtons document={doc} numberOfPages={numberOfPages}/>
          )}
          {previewMode && (
            <CloseButton/>
          )}
          <DocumentSearch document={doc} queryText={queryText} onSearchQueryChange={this.onSearchQueryChange}/>
        </Toolbar>
      )}
      <DocumentView  document={doc} queryText={queryText} onDocumentLoad={this.onDocumentLoad}/>
    </React.Fragment>
  }
 
}



const mapStateToProps = (state, ownProps) => {
  const { document: doc, location: loc } = ownProps;
  const qs = queryString.parse(loc.search);
//  console.log(qs.q)
  return {
    queryText: qs.q || null
  }
}

DocumentViewer = connect(mapStateToProps)(DocumentViewer);

DocumentViewer = withRouter(DocumentViewer);

export default DocumentViewer

class DocumentView extends React.Component {
  render() {
    const { document: doc, queryText, onDocumentLoad } = this.props;
  
    if (doc.schema === 'Email') {
      return <EmailViewer document={doc}/>;
    } else if (doc.schema === 'Table') {
      return <TableViewer document={doc} queryText={queryText} onDocumentLoad={onDocumentLoad}/>;
    } else if (doc.text && !doc.html) {
      return <TextViewer document={doc}/>;
    } else if (doc.html) {
      return <HtmlViewer document={doc}/>;
    } else if (doc.links && doc.links.pdf) {
      return <PdfViewer document={doc} onDocumentLoad={onDocumentLoad} />
    } else if (doc.schema === 'Image') {
      return <ImageViewer document={doc} />;
    } else if (doc.children !== undefined) {
      return <FolderViewer document={doc} queryText={queryText} />;
    } else {
      return <section className="PartialError">
      <div className="pt-non-ideal-state">
        <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
          <span className="pt-icon pt-icon-issue"></span>
        </div>
        <h4 className="pt-non-ideal-state-title">
          <FormattedMessage
            id="document.no_viewer"
            defaultMessage="No preview is available for this document"/>
        </h4>
        <div className="pt-non-ideal-state-description">
          { doc.error_message }
        </div>
      </div>
    </section>
    }
  }
}