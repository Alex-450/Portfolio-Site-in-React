import NavBar from './NavBar';
import Footer from './Footer';
import { Container, Row, Col } from 'react-bootstrap';
import { useEffect } from "react";

const ArticleLayout = ({ children }) => {
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
