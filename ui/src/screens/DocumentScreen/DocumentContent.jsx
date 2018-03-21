import React from 'react';
import { FormattedMessage } from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import { Toolbar, DownloadButton, PagingButtons, DocumentSearch } from 'src/components/Toolbar';
import { DocumentViewer } from 'src/components/DocumentViewer';

import './DocumentContent.css';

class DocumentContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      numberOfPages: 0,
      queryText: ''
     };

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
    
  render() {
    const { document: doc } = this.props;
    const { numberOfPages } = this.state;

    if (doc.status === 'fail' && !(doc.children !== undefined && doc.children > 0)) {
      return (
        <DualPane.ContentPane className="DocumentContent">
          <section className="PartialError">
            <div className="pt-non-ideal-state">
              <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
                <span className="pt-icon pt-icon-issue"/>
              </div>
              <h4 className="pt-non-ideal-state-title">
                <FormattedMessage
                  id="doc.status_fail"
                  defaultMessage="Document failed to import"/>
              </h4>
              <div className="pt-non-ideal-state-description">
                { doc.error_message }
              </div>
            </div>
          </section>
        </DualPane.ContentPane>
      )
    }

    return (
      <DualPane.ContentPane className="DocumentContent">
        <Toolbar>
          <DownloadButton document={doc}/>
          <PagingButtons document={doc} numberOfPages={numberOfPages}/>
          <DocumentSearch document={doc} queryText={this.state.queryText} onSearchQueryChange={this.onSearchQueryChange}/>
        </Toolbar>
        <DocumentViewer document={doc} queryText={this.state.queryText} onDocumentLoad={this.onDocumentLoad} />
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;


