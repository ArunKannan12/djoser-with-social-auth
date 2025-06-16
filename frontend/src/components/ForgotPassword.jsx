import React, { useState } from 'react';
import { Form, Button, Spinner, Container, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('auth/password_reset/', { email });
      toast.success('Password reset link sent to your email.');
    } catch (error) {
      const msg =
        error?.response?.data?.email?.[0] ||
        error?.response?.data?.detail ||
        'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex justify-content-center align-items-center py-5">
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={6} lg={4}>
          <Form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-sm">
            <h4 className="text-center mb-4 text-primary">Forgot Password</h4>

            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={handleOnChange}
                required
              />
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;
