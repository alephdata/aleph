import React, { lazy, Suspense } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import AudioViewer from '/src/viewers/AudioViewer.jsx';
import DefaultViewer from '/src/viewers/DefaultViewer.jsx';
import TableViewer from '/src/viewers/TableViewer.jsx';
import TextViewer from '/src/viewers/TextViewer.jsx';
import HtmlViewer from '/src/viewers/HtmlViewer.jsx';
import ImageViewer from '/src/viewers/ImageViewer.jsx';
import FolderViewer from '/src/viewers/FolderViewer.jsx';
import EmailViewer from '/src/viewers/EmailViewer.jsx';
import VideoViewer from '/src/viewers/VideoViewer.jsx';
import ArticleViewer from '/src/viewers/ArticleViewer.jsx';
import withRouter from '/src/app/withRouter.jsx';
import { SectionLoading } from '/src/components/common/index.jsx';
import { selectEntityDirectionality } from '/src/selectors.js';

import './DocumentViewMode.scss';

const PdfViewer = lazy(
  () => import(/* webpackChunkName: 'base' */ '/src/viewers/PdfViewer.jsx')
);

export class DocumentViewMode extends React.Component {
  renderContent() {
    const { document, activeMode, dir } = this.props;
    const processingError = document.getProperty('processingError');

    if (processingError && processingError.length) {
      return <DefaultViewer document={document} dir={dir} />;
    }

    if (document.schema.isA('Email')) {
      if (activeMode === 'browse') {
        return <FolderViewer document={document} dir={dir} />;
      }
      return (
        <EmailViewer document={document} activeMode={activeMode} dir={dir} />
      );
    }
    if (document.schema.isA('Image')) {
      if (activeMode === 'text') {
        return <TextViewer document={document} dir={dir} />;
      }
      return (
        <ImageViewer document={document} activeMode={activeMode} dir={dir} />
      );
    }
    if (document.schema.isA('Audio')) {
      return <AudioViewer document={document} dir={dir} />;
    }

    if (document.schema.isA('Video')) {
      return <VideoViewer document={document} dir={dir} />;
    }

    if (document.schema.isA('Table')) {
      return <TableViewer document={document} dir={dir} />;
    }
    if (document.schema.isA('PlainText')) {
      return <TextViewer document={document} dir={dir} />;
    }
    if (document.schema.isA('HyperText')) {
      return <HtmlViewer document={document} dir={dir} />;
    }
    if (document.schema.isA('Pages')) {
      return (
        <Suspense fallback={<SectionLoading />}>
          <PdfViewer document={document} activeMode={activeMode} dir={dir} />
        </Suspense>
      );
    }
    if (document.schema.isA('Folder')) {
      return <FolderViewer document={document} dir={dir} />;
    }
    if (document.schema.isA('Article')) {
      return <ArticleViewer document={document} dir={dir} />;
    }
    return <DefaultViewer document={document} dir={dir} />;
  }

  render() {
    return <div className="DocumentViewMode">{this.renderContent()}</div>;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document } = ownProps;
  return {
    dir: selectEntityDirectionality(state, document),
  };
};

export default compose(withRouter, connect(mapStateToProps))(DocumentViewMode);
