import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';

import Query from 'src/app/Query';
import { ErrorSection } from 'src/components/common';
// import { DocumentSearch } from 'src/components/Toolbar';
import { TableViewer, TextViewer, HtmlViewer, PdfViewer, ImageViewer, FolderViewer, EmailViewer } from './index';

import './DocumentViewer.css';

const messages = defineMessages({
  no_viewer: {
    id: 'document.viewer.no_viewer',
    defaultMessage: 'No preview is available for this document',
  },
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
    const { document: doc, intl, queryText, previewMode } = this.props;
    const { numberOfPages } = this.state;
    
    if (doc.schema === 'Email') {
      return <EmailViewer document={doc} queryText={queryText} />;
    } else if (doc.schema === 'Table') {
      return <TableViewer document={doc} queryText={queryText} />;
    } else if (doc.schema === 'Image') {
      return <ImageViewer document={doc} queryText={queryText} />;
    } else if (doc.text && !doc.html) {
      return <TextViewer document={doc} queryText={queryText} />;
    } else if (doc.html) {
      return <HtmlViewer document={doc} queryText={queryText} />;
    } else if (doc.links && doc.links.pdf) {
      return <PdfViewer document={doc}
                        queryText={queryText}
                        numberOfPages={numberOfPages}
                        previewMode={previewMode}
                        onDocumentLoad={this.onDocumentLoad} />
    } else if (doc.schema === 'Folder' || doc.schema === 'Package' || doc.schema === 'Workbook') {
      return <FolderViewer document={doc} queryText={queryText} />;
    } else if (doc.schema === 'Document' || doc.schema === 'Audio' || doc.schema === 'Video') {
      return <ErrorSection visual='issue'
                           title={intl.formatMessage(messages.no_viewer)}
                           description={intl.formatMessage(messages.ignored_file)} />
    } else if (doc.status === 'fail') {
      return <ErrorSection visual='issue'
                           title={intl.formatMessage(messages.no_viewer)}
                           description={doc.error_message} />
    }
  }
  
  render() {
    const { document } = this.props;

    if (document.isLoading) {
      return null;
    }

    return <div className='DocumentViewer'>
      {this.renderContent()}
    </div>
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('search', location, {});
  return { queryText: query.getString('q') }
};

DocumentViewer = connect(mapStateToProps)(DocumentViewer);
DocumentViewer = injectIntl(DocumentViewer);
DocumentViewer = withRouter(DocumentViewer);
export default DocumentViewer
