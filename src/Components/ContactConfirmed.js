import React from 'react';
import { Row, Col, Container, Toast} from 'react-bootstrap';

class ContactConfirmed extends React.Component {
    constructor(props) {
        super();
        this.state = {
            showToast: true
        }
        function onClose() {
            this.setState({showToast: false});
        }
    }
    render() {
    return(
        <div>
        <Container>
            <Row>
                <Col>
            <Toast onClose={this.onClose} className="contact-form-submitted-toast">
                <Toast.Header>
                    <strong>Thanks</strong>
                </Toast.Header>
                <Toast.Body>I'll be in contact soon!</Toast.Body>
            </Toast>
            </Col>
            </Row>
        </Container>
        </div>
    )
}
}

export default ContactConfirmed;