import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { FacebookProvider } from '@kazion/react-facebook-login';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="650325829231-ibjms981gof9t5h4tj19ikg2r0kpvkms.apps.googleusercontent.com">
      <FacebookProvider appId="1186894439790472" version="v19.0">
        <App />
      </FacebookProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
