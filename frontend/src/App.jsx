import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {ToastContainer} from 'react-toastify'
import { Signup, Login, ForgotPassword, Profile, ResetPassword,ActivateAccount, VerifyEmail, } from './components/Index';
import 'react-toastify/ReactToastify.css'


function App() {
  

  return (
    <>
    <Router>
  <ToastContainer />
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/activation/:uid/:token" element={<ActivateAccount />} />
    <Route path='/verify-email' element={<VerifyEmail/>}/>
    <Route path="/signup" element={<Signup />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
  </Routes>
</Router>

    </>
  )
}

export default App
