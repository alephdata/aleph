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
    const { document, intl, queryText, activeMode } = this.props;
    const { numberOfPages } = this.state;
    
    if (document.schema === 'Email') {
      return <EmailViewer document={document} queryText={queryText} />;
    } else if (document.schema === 'Table') {
      return <TableViewer document={document} queryText={queryText} />;
    } else if (document.schema === 'Image') {
      return <ImageViewer document={document} queryText={queryText} />;
    } else if (document.text && !document.html) {
      return <TextViewer document={document} queryText={queryText} />;
    } else if (document.html) {
      return <HtmlViewer document={document} queryText={queryText} />;
    } else if (document.links && document.links.pdf) {
      return <PdfViewer document={document}
                        queryText={queryText}
                        numberOfPages={numberOfPages}
                        activeMode={activeMode}
                        onDocumentLoad={this.onDocumentLoad} />
    } else if (document.schema === 'Folder' || document.schema === 'Package' || document.schema === 'Workbook') {
      return <FolderViewer document={document} queryText={queryText} />;
    } else if (document.schema === 'Document' || document.schema === 'Audio' || document.schema === 'Video') {
      return <ErrorSection visual='issue'
                           title={intl.formatMessage(messages.no_viewer)}
                           description={intl.formatMessage(messages.ignored_file)} />
    } else if (document.status === 'fail') {
      return <ErrorSection visual='issue'
                           title={intl.formatMessage(messages.no_viewer)}
                           description={document.error_message} />
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
export default DocumentViewer;
