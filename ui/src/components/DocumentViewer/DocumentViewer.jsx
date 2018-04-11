import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button } from "@blueprintjs/core";

import Query from 'src/app/Query';
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

class DocumentViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numberOfPages: null
    };
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
  }
  
  onDocumentLoad(documentInfo) {
    this.setState({
      numberOfPages: (documentInfo && documentInfo.numPages) ? documentInfo.numPages : null
    });
  }

  renderContent() {
    const { document: doc, intl, queryText, previewMode} = this.props;
    
    if (doc.schema === 'Email') {
      return <EmailViewer document={doc}/>;
    } else if (doc.schema === 'Table') {
      return <TableViewer document={doc} queryText={queryText}/>;
    } else if (doc.text && !doc.html) {
      return <TextViewer document={doc}/>;
    } else if (doc.html) {
      return <HtmlViewer document={doc}/>;
    } else if (doc.links && doc.links.pdf) {
      return <PdfViewer document={doc} queryText={queryText} previewMode={previewMode} onDocumentLoad={this.onDocumentLoad} />
    } else if (doc.schema === 'Image') {
      return <ImageViewer document={doc}/>;
    } else if (doc.schema === 'Folder' || doc.schema === 'Package' || doc.schema === 'Workbook') {
      if (doc.status === 'fail') return <FolderViewer hasWarning={true} document={doc} queryText={queryText}/>;
      return <FolderViewer document={doc} queryText={queryText}/>;
    } else if(doc.schema === 'Document') {
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
    } else {
      // If document is still loading we still need to return something
      // (or it will trigger an error)
      return null;
    }
  }
  
  render() {
    const { document: doc, showToolbar, toggleMaximise, previewMode } = this.props;
    const { numberOfPages } = this.state;
    
    return <React.Fragment>
      {showToolbar && (
        <Toolbar className={(previewMode === true) ? 'toolbar-preview' : null}>
          {previewMode === true && toggleMaximise && (
            <Button icon="eye-open"
              className="button-maximise"
              onClick={toggleMaximise}>
              <FormattedMessage id="info" defaultMessage="Info"/>
            </Button>
          )}
          {previewMode === true && (
            <Link to={getPath(doc.links.ui)} className="pt-button button-link">
              <span className={`pt-icon-document`}/>
              <FormattedMessage id="sidebar.open" defaultMessage="Open"/>
            </Link>
          )}
          <DownloadButton document={doc}/>
          {numberOfPages !== null && numberOfPages > 0 && (
            <PagingButtons document={doc} numberOfPages={numberOfPages}/>
          )}
          {previewMode === true && (
            <CloseButton/>
          )}
          {previewMode !== true && (
            <DocumentSearch document={doc} />
          )}
        </Toolbar>
      )}
      {this.renderContent()}
    </React.Fragment>
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('search', location, {});
  return {
    queryText: query.getString('q')
  }
}

DocumentViewer = connect(mapStateToProps)(DocumentViewer);
DocumentViewer = injectIntl(DocumentViewer);
DocumentViewer = withRouter(DocumentViewer);
export default DocumentViewer
