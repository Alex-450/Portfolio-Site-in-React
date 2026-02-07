import { Container, Row, Col } from 'react-bootstrap';
import { useEffect } from 'react';
import SpoilerPill from './SpoilerPill';
import { ArticleLayoutProps, ArticleMetadata } from '../types';

const defaultMetadata = {
  author: 'Alex Stearn',
  description: '',
};

function renderMetadataSubtitle(meta: ArticleMetadata & { author: string }) {
  switch (meta.type) {
    case 'film':
      return (
        <>
          <p>
            {meta.topic} - {meta.director} ({meta.year})
          </p>
          {meta.spoilers && (
            <p>
              <SpoilerPill />
            </p>
          )}
        </>
      );
    case 'creative-writing':
      return (
        <p>
          {meta.location} - {meta.author} ({meta.year})
        </p>
      );
    case 'tech':
      return <p>{meta.topic}</p>;
  }
}

const ArticleLayout = ({ metadata, children }: ArticleLayoutProps) => {
  const meta = { ...defaultMetadata, ...metadata };

  const pageTitle =
    meta.type === 'film' || meta.type === 'tech'
      ? `${meta.topic}: ${meta.title}`
      : meta.title;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <article>
            <title>{pageTitle}</title>
            <meta
              name="description"
              content={meta.description}
              property="og:description"
            />
            <meta name="author" content={meta.author} />
            <meta name="keywords" content={meta.keywords} />
            <meta name="title" content={pageTitle} property="og:title" />
            <meta property="og:type" content="website" />
            <h1>{meta.title}</h1>
            {renderMetadataSubtitle(meta)}
            <br></br>
            {children}
          </article>
        </Col>
      </Row>
    </Container>
  );
};

export default ArticleLayout;
