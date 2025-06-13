import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import { FaPen } from 'react-icons/fa';
import ProfileEditModal from './ProfileEditModal';
import {
  Container,
  Row,
  Col,
  Button,
  Image,
  Spinner,
  Collapse,
} from 'react-bootstrap';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [backLoading, setBackLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('auth/users/me/');
        setUser(res.data);
      } catch (error) {
        console.error('Profile fetch failed:', error);
        localStorage.clear();
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh');
      await axiosInstance.post('auth/jwt/logout/', { refresh });
    } catch {
      // ignore
    }
    localStorage.clear();
    toast.info('Logged out successfully');
    navigate('/');
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading profile...</span>
      </div>
    );
  }

  const profilePic =
    user.custom_user_profile ||
    user.social_auth_pro_pic ||
    'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  const handleBackClick = () => {
    setBackLoading(true);
    setTimeout(() => {
      navigate('/reset-password');
    },500); // Optional delay for spinner effect
  };

  return (
    <>
      <Container fluid className="vh-100 d-flex flex-column flex-md-row p-0">
        {/* Sidebar */}
        <div
          className={`bg-white border-end d-flex flex-column align-items-center p-3 ${
            sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'
          }`}
          style={{ transition: 'width 0.3s ease' }}
        >
          <Button
            variant="outline-primary"
            size="sm"
            onClick={toggleSidebar}
            className="mb-3 w-100"
            aria-label="Toggle sidebar"
          >
            &#9776;
          </Button>

          <div
            className="position-relative mb-3"
            style={{ cursor: 'pointer', width: sidebarOpen ? 120 : 50, height: sidebarOpen ? 120 : 50 }}
            onClick={() => setShowModal(true)}
            title="Edit Profile"
          >
            <Image
              src={profilePic}
              roundedCircle
              fluid
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              className="position-absolute bg-primary text-white d-flex justify-content-center align-items-center"
              style={{
                width: sidebarOpen ? 32 : 20,
                height: sidebarOpen ? 32 : 20,
                borderRadius: '50%',
                bottom: 8,
                right: 8,
                boxShadow: '0 0 6px rgba(0,0,0,0.15)',
              }}
            >
              <FaPen size={sidebarOpen ? 16 : 12} />
            </div>
          </div>

          <Collapse in={sidebarOpen}>
            <div className="text-center w-100">
              <h5 className="mb-0">{user.first_name} {user.last_name}</h5>
              <small className="text-muted d-block mb-3">{user.email}</small>
                <Button
            variant="outline-primary"
            size="sm"
            onClick={handleBackClick}
            className="mb-2 w-75 "
            disabled={backLoading}
          >
            {backLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" /> Just a sec...
              </>
            ) : (
              'Forgot Password'
            )}
          </Button>

                             
              <Button
                variant="danger"
                size="sm"
                className="w-75"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </Collapse>
        </div>

        {/* Main content */}
        <main className="flex-grow-1 overflow-auto p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <h2 className="mb-4 text-primary fw-bold">Profile Details</h2>
          <div
            className="bg-white rounded shadow-sm p-4 mx-auto"
            style={{ maxWidth: 650 }}
          >
            <div className="text-center mb-4">
              <Image
                src={profilePic}
                roundedCircle
                style={{ width: 160, height: 160, objectFit: 'cover', border: '4px solid #0d6efd' }}
              />
            </div>

            <Row xs={1} md={2} className="g-3">
              {[
                ['First Name', user.first_name],
                ['Last Name', user.last_name],
                ['Email', user.email],
                ['Phone', user.phone_number || '—'],
                ['City', user.city || '—'],
                ['District', user.district || '—'],
                ['State', user.state || '—'],
                ['PIN Code', user.pincode || '—'],
              ].map(([label, value]) => (
                <Col key={label}>
                  <p className="mb-1 fw-semibold text-muted">{label}</p>
                  <p className="mb-0 fs-5">{value}</p>
                </Col>
              ))}
            </Row>
          </div>
        </main>
      </Container>

      <ProfileEditModal
        show={showModal}
        onHide={() => setShowModal(false)}
        user={user}
        setUser={setUser}
      />

      <style jsx="true">{`
        .sidebar-expanded {
          width: 280px;
        }
        .sidebar-collapsed {
          width: 70px;
        }

        @media (max-width: 767.98px) {
          .sidebar-expanded,
          .sidebar-collapsed {
            width: 100% !important;
            flex-direction: row !important;
            border-right: none !important;
            border-bottom: 1px solid #ddd !important;
            padding: 0.5rem 1rem !important;
            align-items: center !important;
            height: auto !important;
          }

          main {
            padding: 1rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default Profile;
