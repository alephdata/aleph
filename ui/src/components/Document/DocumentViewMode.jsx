import React, { lazy } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import { fetchDocumentProcessingReport } from 'src/actions';
import { selectDocumentProcessingReport } from 'src/selectors';
import DefaultViewer from 'src/viewers/DefaultViewer';
import CSVStreamViewer from 'src/viewers/CsvStreamViewer';
import TableViewer from 'src/viewers/TableViewer';
import TextViewer from 'src/viewers/TextViewer';
import HtmlViewer from 'src/viewers/HtmlViewer';
import ImageViewer from 'src/viewers/ImageViewer';
import FolderViewer from 'src/viewers/FolderViewer';
import EmailViewer from 'src/viewers/EmailViewer';

import './DocumentViewMode.scss';

const PdfViewer = lazy(() => import(/* webpackChunkName: 'base' */ 'src/viewers/PdfViewer'));

/*eslint-disable*/
export class DocumentViewMode extends React.Component {
  componentDidMount() {
    this.fetchReportIfNeeded();
  }

  componentDidUpdate() {
    this.fetchReportIfNeeded();
  }

  fetchReportIfNeeded() {
    const { document, processingReport } = this.props;
    if (processingReport.shouldLoad) {
      this.props.fetchDocumentProcessingReport(document);
    }
  }

  renderContent() {
    const { document, queryText, activeMode, processingReport } = this.props;

    if (processingReport.loadedAt && processingReport.has_error) {
      return <DefaultViewer document={document} queryText={queryText} />;
    }

    if (document.schema.isA('Email')) {
      if (activeMode === 'browse') {
        return (
          <FolderViewer document={document} queryText={queryText} />
        );
      }
      return (
        <EmailViewer document={document} queryText={queryText} activeMode={activeMode} />
      );
    }
    if (document.schema.isA('Image')) {
      if (activeMode === 'text') {
        return (
          <TextViewer
            document={document}
            queryText={queryText}
          />
        );
      }
      return (
        <ImageViewer
          document={document}
          queryText={queryText}
          activeMode={activeMode}
        />
      );
    }
    if (document.schema.isA('Table')) {
      if (!document.links || !document.links.csv) {
        return (
          <TableViewer
            document={document}
            queryText={queryText}
          />
        );
      }
      return (
        <CSVStreamViewer
          document={document}
          queryText={queryText}
        />
      );
    }
    if (document.schema.isA('PlainText')) {
      return (
        <TextViewer
          document={document}
          queryText={queryText}
        />
      );
    }
    if (document.schema.isA('HyperText')) {
      return (
        <HtmlViewer
          document={document}
          queryText={queryText}
        />
      );
    }
    if (document.schema.isA('Pages')) {
      return (
        <PdfViewer
          document={document}
          queryText={queryText}
          activeMode={activeMode}
        />
      );
    }
    if (document.schema.isA('Folder')) {
      return (
        <FolderViewer
          document={document}
          queryText={queryText}
        />
      );
    }
    return <DefaultViewer document={document} queryText={queryText} />;
  }

  render() {
    const { document } = this.props;
    if (document.isLoading || document.shouldLoad) {
      return null;
    }

    return (
      <div className="DocumentViewMode">
        {this.renderContent()}
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location, document } = ownProps;
  const query = Query.fromLocation('entities', location, {}, '');
  return {
    queryText: query.getString('q'),
    processingReport: selectDocumentProcessingReport(state, document.id),
  };
};

const mapDispatchToProps = { fetchDocumentProcessingReport };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  connect(mapStateToProps, {})
)(DocumentViewMode);
