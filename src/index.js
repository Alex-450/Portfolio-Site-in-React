import './css/index.css';
import * as serviceWorker from './serviceWorker';
import Router from './Components/Router';
// import { render } from 'react-dom';

import { createRoot } from 'react-dom/client';
const container = document.querySelector("#root")
const root = createRoot(container)
root.render(<Router />)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
