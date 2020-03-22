import React from 'react';
import { Row, Col, Container, Toast} from 'react-bootstrap';

class ContactConfirmed extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showToast: true,
        }
    }
    toggleShowToast = () => {
        this.setState({showToast: false});
    }
    render() {
    return(
        <div>
        <Container>
            <Row>
                <Col>
                    <Toast show={this.state.showToast} onClose={this.toggleShowToast} className="contact-form-submitted-toast">
                        <Toast.Header className="contact-form-submitted-toast-header">
                        <strong>Thanks {this.props.contactFormName}</strong>
                        </Toast.Header>
                        <Toast.Body>
                            <p>
                                <strong>Check over the information you sent:</strong>
                            </p>
                            <p>Email: {this.props.contactFormEmail}</p>
                            <p>Your message:</p>
                            <p>{this.props.contactFormMessage}</p>
                            <p>I'll be in contact soon!</p>
                        </Toast.Body>
                    </Toast>
                </Col>
            </Row>
        </Container>
        </div>
    )
}
}

export default ContactConfirmed;
