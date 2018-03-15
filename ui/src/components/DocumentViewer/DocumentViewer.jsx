import React from 'react';
import { FormattedMessage } from 'react-intl';

import TableViewer from './TableViewer';
import TextViewer from './TextViewer';
import HtmlViewer from './HtmlViewer';
import PdfViewer from './PdfViewer';
import ImageViewer from './ImageViewer';
import FolderViewer from './FolderViewer';
import EmailViewer from './EmailViewer';

export default class extends React.Component {
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