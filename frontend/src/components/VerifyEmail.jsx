import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";

const VerifyEmail = () =>{
    const location = useLocation();  
    const preFilledEmail = location.state?.email || '';
    
    const [email, setEmail] = useState(preFilledEmail);
    const navigate = useNavigate()
    const handleResend = async () => {
        try {
            const response = await axios.post("http://127.0.0.1:8000/api/auth/resend-activation/", { email });
            console.log(response.status);
            toast.success("Activation email resent successfully!");
        } catch (error) {
            console.error("Resend activation error:", error.response ? error.response.data : error.message);
            if (error.response) {
                        // Show exact backend error message if available
                toast.error(error.response.data.detail || "Failed to resend activation email.");
            } else {
                toast.error("Network error or server is unreachable.");
            }
}
    };
return (
        <div className="container mt-5 text-center">
            <h3>Email Verification</h3>
            <p>Please check your inbox for an activation email.</p>
            <input 
                type="email" 
                className="form-control" 
                placeholder="Enter your email" 
                value={email} 
                required
                disabled
                onChange={(e) => setEmail(e.target.value)} 
            />
            <button className="btn btn-warning mt-3" onClick={handleResend}>
                Resend Activation Email
            </button>
           
           <p>
            Back to <span style={{ cursor: "pointer", color: "blue" }} onClick={() => navigate("/")}>Signup</span>
            </p>

        </div>
    );
};

export default VerifyEmail;
