import React from 'react'
import {useGoogleLogin,GoogleLogin} from '@react-oauth/google'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const GoogleAuth = () => {
    const navigate = useNavigate()
    const handleGoogleLogin = async (credentialResponse) =>{
        try{
            const res = await axios.post('http://127.0.0.1:8000/api/auth/social/google/',{
                id_token: credentialResponse.credential
            });
            if (res.status === 200) {
                const {full_name,email,access_token,refresh_token,social_auth_pro_pic} = res.data
                localStorage.setItem('access',access_token);
                localStorage.setItem('refresh',refresh_token);
                localStorage.setItem('user', JSON.stringify({full_name,email,profile_picture:social_auth_pro_pic}));
                console.log('google',res.data)
                toast.success(`Welcome ${full_name}`);
                navigate('/profile');
            }
        }catch (error) {
            console.error('Google login failed:', error.response?.data || error.message);
            toast.error('Google login failed. Please try again.');
    }
    }
  return (
    <div>
        <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={()=>toast.error('Googlee sign-in failed')}/>
    </div>
  )
}

export default GoogleAuth