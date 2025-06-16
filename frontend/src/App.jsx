import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {ToastContainer} from 'react-toastify'
import { Signup, Login, ForgotPassword, Profile, ResetPassword,ActivateAccount, VerifyEmail,ConfirmResetPassword } from './components/Index';
import 'react-toastify/dist/ReactToastify.css';
import './css/DarkMode.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from './utils/Modal';
import useAutoLogout from './utils/useAutoLogout';

function AppRoutes(){
  const { modalOpen, onConfirm, onClose } = useAutoLogout(); 

  return (
    <>
    
<ToastContainer />
<Modal
      isOpen={modalOpen}
      title="Session Expiring"
      message="You will be logged out soon due to inactivity. Do you want to stay logged in?"
      onConfirm={onConfirm}
      onClose={onClose}

/>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/activation/:uid/:token" element={<ActivateAccount />} />
      <Route path='/verify-email' element={<VerifyEmail/>}/>
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path='/reset-password-confirm/:uid/:token/' element={<ConfirmResetPassword/>}/>
    </Routes>
    
    </>
  )
}


function App() {
  

  return (
    <>
    <Router>
        <AppRoutes/>
</  Router>

    </>
  )
}

export default App
