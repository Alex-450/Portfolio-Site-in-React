import React from 'react';
import { Container, Toast} from 'react-bootstrap';

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
                    <Toast show={this.state.showToast} onClose={this.toggleShowToast} className="contact-form-submitted-toast">
                        <Toast.Header className="contact-form-submitted-toast-header">
                        <strong>Thanks {this.props.contactFormName}, I'll be in contact soon!</strong>
                        </Toast.Header>
                        <Toast.Body>
                            <p>
                                <strong>Check over the information you sent:</strong>
                            </p>
                            <p>Email: {this.props.contactFormEmail}</p>
                            <p>Your message: {this.props.contactFormMessage}</p>
                        </Toast.Body>
                    </Toast>
        </Container>
        </div>
    )
}
}

export default ContactConfirmed;
