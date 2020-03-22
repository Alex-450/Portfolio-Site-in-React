import React from 'react';
import '../css/index.css';
import NavBar from './NavBar';
import { Form, Button, Col, Row, Container} from 'react-bootstrap';
import Footer from './Footer';
import ContactConfirmed from './ContactConfirmed';


class ContactForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isSubmitted: false,
            fullName: "",
            email: "",
            message: "",
    };
    this.handleInputChange = this.handleInputChange.bind(this);
}

handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    const value = target.value;
    this.setState({
      [name]: value
    });
  }
    handleSubmit = event => {
        event.preventDefault();
        console.log(this.nameInput);
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
                    <Form.Control name="fullName" required type="text" placeholder="e.g. Alex Smith" onChange={this.handleInputChange}/>
                    </Col>
                    </Form.Group>

                    <Form.Group as={Row}>
                    <Form.Label column sm={2}>Email address →</Form.Label>
                    <Col sm={4}>
                    <Form.Control name="email" required type="email" placeholder="e.g. alex.smith@email.com" onChange={this.handleInputChange}/>
                    </Col>
                    </Form.Group>

                    <Form.Group as={Row}>
                    <Form.Label column sm={2}>Your message →</Form.Label>
                    <Col sm={4}>
                    <Form.Control name="message" as="textarea" rows="5" required placeholder="Hello there 👋" onChange={this.handleInputChange} />
                    </Col>
                    </Form.Group>
                    <Col sm={{span: 12}}>
                    <Button variant="dark" type="submit" className="contact-form-submit">Send →</Button>
                    </Col>
                </Form>
                {this.state.isSubmitted && <Row>
                    <Col>
                    <ContactConfirmed contactFormName={this.state.fullName} contactFormEmail={this.state.email} contactFormMessage={this.state.message} />
                    </Col>
                    </Row>}
        </Container>
        <Footer />
        </div>
    )
}
}

export default ContactForm;