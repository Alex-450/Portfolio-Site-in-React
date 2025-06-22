import '../css/index.css';
import { HashRouter, Route, Switch } from 'react-router-dom';
import App from '../App';
import Blog from './Blog';
import BlackPanther from './blogs/BlackPanther';
import GrandBudapestHotel from './blogs/GrandBudapestHotel';
import AliAngstEssenSeele from './blogs/AliAngstEssenSeele';
import Fitzcarraldo from './blogs/Fitzcarraldo';

const Router = () => (
  <HashRouter basename={process.env.PUBLIC_URL}>
  <Switch>
      <Route exact path="/" component={App} />
      <Route exact path="/blog" component={Blog} />
      <Route exact path="/black-panther-radical" component={BlackPanther} />
      <Route exact path="/grand-budapest-hotel-refugees" component={GrandBudapestHotel} />
      <Route exact path="/ali-angst-essen-seele-auf" component={AliAngstEssenSeele} />
      <Route exact path="/fitzcarraldo-cost-of-art" component={Fitzcarraldo} />
  </Switch>
  </HashRouter>
)

export default Router;
