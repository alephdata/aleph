import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import Query from 'src/app/Query';
import { ErrorSection } from 'src/components/common';
import { Toolbar, CloseButton, ParentButton, PagingButtons, DocumentSearch, ModeButtons } from 'src/components/Toolbar';
import getPath from 'src/util/getPath';
import { TableViewer, TextViewer, HtmlViewer, PdfViewer, ImageViewer, FolderViewer, EmailViewer } from './index';
import { RefreshCallout } from 'src/components/common';
import DocumentDeleteDialog from 'src/dialogs/DocumentDeleteDialog/DocumentDeleteDialog';

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
      numberOfPages: null,
      isRefreshCalloutOpen: false,
      isDeleteDisabled: true,
      selectedFiles: [],
      deleteIsOpen: false,
    };
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
    this.disableOrEnableDelete = this.disableOrEnableDelete.bind(this);
    this.toggleDeleteCase = this.toggleDeleteCase.bind(this);
    this.setRefreshCallout = this.setRefreshCallout.bind(this);
    this.setDocuments = this.setDocuments.bind(this);
  }
  
  onDocumentLoad(documentInfo) {
    this.setState({
      numberOfPages: (documentInfo && documentInfo.numPages) ? documentInfo.numPages : null
    });
  }

  setDocuments(selectedFiles) {
    this.setState({selectedFiles: selectedFiles});
  }

  disableOrEnableDelete(isDisabled) {
    this.setState({isDeleteDisabled: isDisabled});
  }

  toggleDeleteCase() {
    this.setState({deleteIsOpen: !this.state.deleteIsOpen});
  }

  setRefreshCallout() {
    this.setState({isRefreshCalloutOpen: !this.state.isRefreshCalloutOpen});
  }

  renderContent() {
    const { document: doc, intl, queryText, previewMode } = this.props;
    
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
      return <PdfViewer document={doc} queryText={queryText} previewMode={previewMode} onDocumentLoad={this.onDocumentLoad} />
    } else if (doc.schema === 'Folder' || doc.schema === 'Package' || doc.schema === 'Workbook') {
      return <FolderViewer
        document={doc}
        queryText={queryText}
        hasWarning={doc.status === 'fail'}
        disableOrEnableDelete={this.disableOrEnableDelete}
        setDocuments={this.setDocuments}
        setRefreshCallout={this.setRefreshCallout}/>;
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
    const { document: doc, showToolbar, previewMode } = this.props;
    const { numberOfPages, selectedFiles, isRefreshCalloutOpen, isDeleteDisabled } = this.state;
    const isFolder = (doc.schema === 'Folder' || doc.schema === 'Package' || doc.schema === 'Workbook');

    if (doc.isLoading) {
      return null;
    }
    
    return <div className='DocumentViewer'>
      {isRefreshCalloutOpen && <RefreshCallout/>}
      {showToolbar && (
        <Toolbar className={(previewMode === true) ? 'toolbar-preview' : null}>
          {doc.collection.writeable && isFolder && <button
            type="button"
            className="pt-button pt-icon-delete"
            disabled={isDeleteDisabled}
            onClick={this.toggleDeleteCase}><FormattedMessage id="document.viewer.delete"
                                                              defaultMessage="Delete" /></button>}
          {previewMode === true && (
            <Link to={getPath(doc.links.ui)} className="pt-button button-link">
              <span className={`pt-icon-share`}/>
              <FormattedMessage id="sidebar.open" defaultMessage="Open"/>
            </Link>
          )}
          {numberOfPages !== null && numberOfPages > 0 && (
            <PagingButtons document={doc} numberOfPages={numberOfPages}/>
          )}
          {previewMode === true && (
            <CloseButton />
          )}
          {previewMode !== true && (
            <DocumentSearch document={doc} />
          )}
        </Toolbar>
      )}
      {this.renderContent()}
      <DocumentDeleteDialog documents={selectedFiles}
                            isOpen={this.state.deleteIsOpen}
                            toggleDialog={this.toggleDeleteCase} />
    </div>
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('search', location, {});
  return { queryText: query.getString('q') }
}

DocumentViewer = connect(mapStateToProps)(DocumentViewer);
DocumentViewer = injectIntl(DocumentViewer);
DocumentViewer = withRouter(DocumentViewer);
export default DocumentViewer
