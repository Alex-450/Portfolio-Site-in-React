import '../css/index.css';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Blog from './Blog';
import BlackPanther from './blogs/BlackPanther';
import GrandBudapestHotel from './blogs/GrandBudapestHotel';
import AliAngstEssenSeele from './blogs/AliAngstEssenSeele';
import Fitzcarraldo from './blogs/Fitzcarraldo';
import TwentyEightYearsLater from './blogs/TwentyEightYearsLater';

const Router = () => (
  <HashRouter basename={process.env.PUBLIC_URL}>
  <Switch>
      <Route exact path="/" component={Blog} />
      <Route exact path="/black-panther-radical" component={BlackPanther} />
      <Route exact path="/grand-budapest-hotel-refugees" component={GrandBudapestHotel} />
      <Route exact path="/ali-angst-essen-seele-auf" component={AliAngstEssenSeele} />
      <Route exact path="/fitzcarraldo-cost-of-art" component={Fitzcarraldo} />
      <Route exact path="/28-years-later" component={TwentyEightYearsLater}></Route>
  </Switch>
  </HashRouter>
)

export default Router;
