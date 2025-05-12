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
            <p>I studied History & German and have spent time living in Berlin and the Austrian alps. I worked in hospitality part-time from the age of 16, until I was 24. I have worked in all sorts of places, from <a target="_blank" rel="noopener noreferrer" href="https://7bone.co.uk/">burger joints</a> to cocktail bars.</p>
            <p>In 2018 I joined <a target="_blank" rel="noopener noreferrer" href="https://rekki.com/">REKKI</a>, a company providing technology for a sector I had grown to love: hospitality. I started working in the customer support team and after three months transitioned to the tech team. I've been working as a QA Tester ever since and am now trying to hone my coding skills with projects like this site!</p>
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
                  <td>2023 - Present</td>
                  <td><a href="https://fuga.com" target="_blank" rel="noopener noreferrer">FUGA</a></td>
                  <td>Software Developer</td>
              </tr>
              <tr>
                  <td>2021 - 2023</td>
                  <td><a href="https://fuga.com" target="_blank" rel="noopener noreferrer">FUGA</a></td>
                  <td>Junior Software Developer</td>
              </tr>
               <tr>
                   <td>2019 - 2021</td>
                   <td><a href="https://rekki.com" target="_blank" rel="noopener noreferrer">REKKI</a></td>
                   <td>QA Tester</td>
               </tr>
               <tr>
                   <td>December 2018 - March 2019</td>
                   <td><a href="https://rekki.com" target="_blank" rel="noopener noreferrer">REKKI</a></td>
                   <td>Customer Support Specialist</td>
               </tr>
               <tr>
                   <td>October 2017 - December 2019</td>
                   <td><a href="https://thecagewinebar.com" target="_blank" rel="noopener noreferrer">The Cage Wine Bar</a></td>
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
                        <td>2021</td>
                        <td><a href="https://https://www.lewagon.com//" target="_blank" rel="noopener noreferrer">Le Wagon</a></td>
                        <td>Fullstack Web Development</td>
                    </tr>
                    <tr>
                        <td>2015 - 2018</td>
                        <td><a href="https://www.southampton.ac.uk/" target="_blank" rel="noopener noreferrer">University of Southampton</a></td>
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
