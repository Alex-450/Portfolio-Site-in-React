import React from 'react';
import '../css/index.css';
import Button from 'react-bootstrap/Button';
import NavBar from './NavBar';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Footer from './Footer';
import ContactConfirmed from './ContactConfirmed';


class ContactForm extends React.Component {
    nameInput = React.createRef();
    state = {
            isSubmitted: false,
    }
    handleSubmit = event => {
        event.preventDefault();
        console.log(this.nameInput.current.value);
        this.setState({isSubmitted: true});
       /* nameInput = this.nameInput.current.value; */
        event.currentTarget.reset();
    }

    render() {
    return(
        <div>
            <NavBar />
            <Container className="title-container">
                <h2 className="page-title">Get in touch</h2>
                <p>Fill in the contact form to send me an email.</p>
                <p>Or hit one of the links at the bottom of this page to contact me in another way.</p>
            </Container>
            <Container>
                <Form className="contact-form" onSubmit={this.handleSubmit}>
                    <Form.Group as={Row}>
                    <Form.Label column sm={2}>Name →</Form.Label>
                    <Col sm={4}>
                    <Form.Control required type="text" placeholder="e.g. Alex Smith" ref={this.nameInput} />
                    </Col>
                    </Form.Group>

                    <Form.Group as={Row}>
                    <Form.Label column sm={2}>Email address →</Form.Label>
                    <Col sm={4}>
                    <Form.Control required type="email" placeholder="e.g. alex.smith@email.com" />
                    </Col>
                    </Form.Group>

                    <Form.Group as={Row}>
                    <Form.Label column sm={2}>Your message →</Form.Label>
                    <Col sm={4}>
                    <Form.Control as="textarea" rows="5" required placeholder="Hello there 👋" />
                    </Col>
                    </Form.Group>
                    <Col sm={{span: 12}}>
                    <Button variant="dark" type="submit" className="before-submit">Send</Button>
                    </Col>
                    <Row>
                    <Col>
                        {this.state.isSubmitted && <ContactConfirmed nameInput={this.nameInput.current.value} />}
                    </Col>
                    </Row>
                </Form>
        </Container>
        <Footer />
        </div>
    )
}
}

export default ContactForm;