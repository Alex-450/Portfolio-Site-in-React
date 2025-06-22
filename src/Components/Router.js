import '../css/index.css';
import { HashRouter, Route, Switch } from 'react-router-dom';
import App from '../App';
import About from './About';
import Blog from './Blog';
import Blog1 from './blogs/Blog1';
import Blog2 from './blogs/Blog2';
import Blog3 from './blogs/Blog3';

const Router = () => (
  <HashRouter basename={process.env.PUBLIC_URL}>
  <Switch>
      <Route exact path="/" component={App} />
      <Route exact path="/about" component={About} />
      <Route exact path="/blog" component={Blog} />
      <Route exact path="/black-panther-radical" component={Blog1} />
      <Route exact path="/grand-budapest-hotel-refugees" component={Blog2} />
      <Route exact path="/ali-angst-essen-seele-auf" component={Blog3} />
  </Switch>
  </HashRouter>
)

export default Router;
