import React from 'react';
import { Link } from 'react-router-dom';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import { Button } from "@blueprintjs/core";

import { Toolbar, CloseButton, DownloadButton, PagingButtons, DocumentSearch } from 'src/components/Toolbar';
import getPath from 'src/util/getPath';
import TableViewer from './TableViewer';
import TextViewer from './TextViewer';
import HtmlViewer from './HtmlViewer';
import PdfViewer from './PdfViewer';
import ImageViewer from './ImageViewer';
import FolderViewer from './FolderViewer';
import EmailViewer from './EmailViewer';

const messages = defineMessages({
  ignored_file: {
    id: 'document.viewer.ignored_file',
    defaultMessage: 'The system does not work with these types of files. Please download it so you’ll be able to see it.',
  }
});

export default class extends React.Component {
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

      // @FIXME: This is a hack to trigger window resize event when displaying
      // a document preview. This forces the PDF viewer to display at the 
      // right size (otherwise it displays at the incorrect height).    
      //setTimeout(() => {window.dispatchEvent(new Event('resize')) }, 1500);
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
      <DocumentViewer  document={doc} queryText={queryText} onDocumentLoad={this.onDocumentLoad}/>
    </React.Fragment>
  }
 
}

class DocumentViewer extends React.Component {
  render() {
    const { document: doc, queryText, onDocumentLoad, intl } = this.props;
  
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
    } else if (doc.schema === 'Folder' || doc.schema === 'Package') {
      if(doc.status === 'fail') return <FolderViewer hasWarning={true} document={doc} queryText={queryText}/>;
      return <FolderViewer document={doc} queryText={queryText} />;
    } else if(doc.schema === 'Document'){
      return <section className="PartialError outer-div">
        <div className="pt-non-ideal-state inner-div">
          <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
            <span className="pt-icon pt-icon-issue"/>
          </div>
          <h4 className="pt-non-ideal-state-title">
            <FormattedMessage
              id="document.no_viewer"
              defaultMessage="No preview is available for this document"/>
          </h4>
          <div className="pt-non-ideal-state-description">
            { intl.formatMessage(messages.ignored_file)}
          </div>
        </div>
      </section>
    } else if(doc.status === 'fail') {
      return <section className="PartialError outer-div">
      <div className="pt-non-ideal-state inner-div">
        <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
          <span className="pt-icon pt-icon-issue"/>
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

DocumentViewer = injectIntl(DocumentViewer);