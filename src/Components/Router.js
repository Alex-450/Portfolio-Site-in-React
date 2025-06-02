import '../css/index.css';
import { HashRouter, Route, Switch } from 'react-router-dom';
import App from '../App';
import About from './About';
import Blog from './Blog';

const Router = () => (
    <HashRouter basename={process.env.PUBLIC_URL}>
    <Switch>
        <Route exact path="/" component={App} />
        <Route exact path="/about" component={About} />
        <Route exact path="/blog" component={Blog} />
    </Switch>
    </HashRouter>
)

export default Router;
