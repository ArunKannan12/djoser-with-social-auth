import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";


const ActivateAccount = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const activateUser = async () => {
            try {
                await axios.post("http://localhost:8000/api/auth/users/activation/", {
                    uid,
                    token
                });
                toast.success("Account activated successfully!");
                navigate("/profile");  // Redirect to profile upon success
            } catch (error) {
                toast.error("Activation failed:", error);
                navigate("/login");  // Redirect to login if activation fails
            }
        };
        
        activateUser();
    }, [uid, token, navigate]);

    return <p>Activating your account...</p>;
};

export default ActivateAccount;