import NavBar from './NavBar';
import Footer from './Footer';
import { Container, Row, Col } from 'react-bootstrap';
import { useEffect } from "react";

const ArticleLayout = ({ metadata, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <NavBar />
      <Container className="my-5">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <article>
              <title>{metadata.title}</title>
              <meta name='author' content={metadata.author} />
              <meta name='keywords' content={metadata.keywords} />
              {children}
            </article>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default ArticleLayout;
