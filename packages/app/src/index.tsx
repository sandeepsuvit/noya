import { Suspense, StrictMode } from 'react';
import * as ReactDOM from 'react-dom';

import App from './App';
import './index.css';

ReactDOM.render(
  <StrictMode>
    <Suspense fallback="Loading...">
      <App />
    </Suspense>
  </StrictMode>,
  document.getElementById('root'),
);

// Disable native context menu on non-input element
document.oncontextmenu = (event) => {
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  )
    return;

  event.preventDefault();
};
