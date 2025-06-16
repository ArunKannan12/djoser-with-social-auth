import React, { useState } from 'react'
import { useParams,useNavigate } from 'react-router-dom'
import axiosInstance from '../utils/axiosInstance'
import { toast } from 'react-toastify'
import { Container,Row,Col,Form,Button,Spinner,InputGroup } from 'react-bootstrap';
import {FaEye,FaEyeSlash} from 'react-icons/fa'

const ConfirmResetPassword = () => {
    const {uid,token} = useParams();
    const navigate = useNavigate();

    const [formData,setFormData] = useState({new_password:"",
                                            re_new_password:""})
    
    const [loading,setLoading] = useState(false);

    const [showPassword,setShowPassword] = useState(false);
    const [showConfirm,setShowconfirm] = useState(false);

    const {new_password,re_new_password} = formData
    const handleOnChange = (e) =>{
        setFormData({...formData,[e.target.name]: e.target.value});

    }

    const handleOnSubmit = async (e) =>{
        e.preventDefault();

        setLoading(true)
        
        try{
            const res = await axiosInstance.post('auth/users/reset_password_confirm/',{
                uid,
                token,
                new_password,
                re_new_password
            });

            toast.success('password reset successfull');
            navigate('/');

        }catch(error){
          console.error(error);
          const errMsg = 
            error?.response?.data?.new_password?.[0] ||
            error?.response?.data?.non_field_errors?.[0] ||
            'Reset failed. Please try again.';
          toast.error(errMsg);
        }
        finally{
            setLoading(false)
        }
    }
  return (
    <Container fluid className="vh-100 d-flex justify-content-center align-items-center">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={6} lg={4}>
          <Form
            onSubmit={handleOnSubmit}
            className="bg-white p-4 rounded shadow-sm"
          >
            <h4 className="text-center mb-4 text-primary">Reset Password</h4>

            <Form.Group controlId="newPassword" className="mb-3">
              <Form.Label>New Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="new_password"
                  placeholder="Enter your new password"
                  value={new_password}
                  onChange={handleOnChange}
                  disabled={loading}
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group controlId="confirmPassword" className="mb-4">
              <Form.Label>Confirm Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirm ? 'text' : 'password'}
                  name="re_new_password"
                  placeholder="Confirm your new password"
                  value={re_new_password}
                  onChange={handleOnChange}
                  disabled={loading}
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowconfirm((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  )
}

export default ConfirmResetPassword