import { Container, Row, Col } from 'react-bootstrap';
import { useEffect } from "react";

const ArticleLayout = ({ metadata, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <article>
            <title>{`${metadata.filmTitle}: ${metadata.title}`}</title>
            <meta name='description' content={metadata.description} property='og:description' />
            <meta name='author' content={metadata.author} />
            <meta name='keywords' content={metadata.keywords} />
            <meta name='title' content={`${metadata.filmTitle}: ${metadata.title}`} property="og:title" />
            <meta property="og:type" content="website" />
            <h1>{metadata.title}</h1>
            <p>{metadata.filmTitle} - {metadata.director} ({metadata.year})</p>
            <br></br>
            {children}
          </article>
        </Col>
      </Row>
    </Container>
  );
};

export default ArticleLayout;
