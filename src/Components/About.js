import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import { Container, Tabs, Tab, Table, Row, Col} from 'react-bootstrap';

class About extends React.Component {
    render() {
    return(
        <div>
            <NavBar />
        <Container className="title-container">
            <Row>
                <Col md={8}>
            <h2 className="page-title">About me</h2>
            <p>I grew up and went to school in Surrey and then went to university in Southampton.</p>
            <p>I studied History & German and have spent time living in Berlin and the Austrian alps. I worked in hospitality part-time from the age of 16, until I was 24. I have worked in all sorts of places, from <a target="_blank" rel="noopener noreferrer" href="https://7bone.co.uk/">burger joints</a> to a cocktail bars.</p>
            <p>In 2018 I joined <a target="_blank" rel="noopener" href="https://rekki.com/">REKKI</a>, a company providing technology for a sector I had grown to love: hospitality. I started working in the customer support team and after three months transitioned to the tech team. I've been working as a QA Tester ever since and am now trying to hone my coding skills with projects like this site!</p>
            <p>Check out my education and work experience below:</p>
            <p></p>
            </Col>
            </Row>
       </Container>
        <Container>
        <Row>
            <Col>
       <Tabs defaultActiveKey="workExperience">
       <Tab eventKey="workExperience" title="Work Experience">
       <Table striped hover bordered>
           <thead>
               <tr>
                   <th>When:</th>
                   <th>Where:</th>
                   <th>What:</th>
               </tr>
           </thead>
           <tbody>
               <tr>
                   <td>2019 - Present</td>
                   <td>REKKI</td>
                   <td>QA Tester</td>
               </tr>
               <tr>
                   <td>December 2018 - March 2019</td>
                   <td>REKKI</td>
                   <td>Customer Support Specialist</td>
               </tr>
               <tr>
                   <td>October 2017 - December 2019</td>
                   <td>The Cage Wine Bar</td>
                   <td>Assistant Manager</td>
               </tr>
           </tbody>
       </Table>
       </Tab>
       <Tab eventKey="education" title="Education">
           <Table striped hover bordered>
                <thead>
                    <tr>
                        <th>When:</th>
                        <th>Where:</th>
                        <th>What:</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>2019 - Present</td>
                        <td>OpenClassrooms</td>
                        <td>Full Stack Developer Qualification</td>
                    </tr>
                    <tr>
                        <td>2015 - 2018</td>
                        <td>University of Southampton</td>
                        <td>BA German & History - First Class Honours</td>
                    </tr>
                </tbody>

           </Table>
       </Tab>
        </Tabs>
        </Col>
        </Row>
        </Container>
        <Footer />
       </div>

    )
}
}

export default About;