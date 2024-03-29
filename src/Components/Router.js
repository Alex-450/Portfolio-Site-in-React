import React from 'react';
import '../css/index.css';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import App from '../App';
import ContactForm from './ContactForm';
import About from './About';
import Blog from './Blog';

const Router = () => (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
    <Switch>
        <Route exact path="/" component={App} />
        <Route exact path="/contact" component={ContactForm} />
        <Route exact path="/about" component={About} />
        <Route exact path="/blog" component={Blog} />
    </Switch>
    </BrowserRouter>
)

export default Router;
