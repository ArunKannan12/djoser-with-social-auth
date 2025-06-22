import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import { FaPen } from 'react-icons/fa';
import ProfileEditModal from './ProfileEditModal';
import DarkModeToggle from '../utils/DarkModeToggle';
import {
  Container,
  Row,
  Col,
  Button,
  Image,
  Spinner,
  Collapse,
} from 'react-bootstrap';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { refreshAccessToken } from '../utils/refreshAccessToken';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [backLoading, setBackLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

 useEffect(() => {
  const fetchProfile = async () => {
    try {
      // 🔒 Use fallback from sessionStorage if localStorage is empty
      const access = localStorage.getItem("access") || sessionStorage.getItem("access");
      const refresh = localStorage.getItem("refresh") || sessionStorage.getItem("refresh");

      if (!access || !refresh) {
        console.warn('Missing tokens');
        navigate("/");
        return;
      }

      const decoded = jwtDecode(access);
      const isExpired = dayjs.unix(decoded.exp).diff(dayjs()) < 0;

      if (isExpired) {
        console.log("Access token expired. Refreshing...");
        const newAccess = await refreshAccessToken();
        if (!newAccess) {
          navigate("/");
          return;
        }
      }

      const res = await axiosInstance.get('auth/users/me/');
      setUser(res.data);
    } catch (error) {
      console.error("Profile fetch failed:", error);
      localStorage.clear();
      sessionStorage.clear();
      navigate("/");
    }
  };

  fetchProfile();
}, [navigate]);

  const handleLogout = async () => {
    const refresh =
localStorage.getItem('refresh') || sessionStorage.getItem('refresh');
    try {
        if (refresh) {
      await axiosInstance.post('auth/jwt/logout/', { refresh });
    }
    } catch {
      // ignore
    }
    localStorage.clear();
    sessionStorage.clear();
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
    <DarkModeToggle/>
      <Container fluid className="vh-100 d-flex flex-column flex-md-row p-0">
        {/* Sidebar */}
        {/* Sidebar */}
<Col
  xs="auto"
  className={`bg-white border-end p-3 d-flex flex-column align-items-center ${
    sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'
  }`}
  style={{ transition: 'width 0.3s ease' }}
>
  {/* Toggle Button */}
  <Button
    variant="outline-primary"
    size="sm"
    onClick={toggleSidebar}
    className="mb-3"
    aria-label="Toggle sidebar"
  >
    &#9776;
  </Button>

  {/* Show rest of sidebar only if open */}
  {sidebarOpen && (
    <>
      {/* Profile Picture with edit icon */}
      <div
        className="position-relative mb-3"
        style={{ width: 120, height: 120, cursor: 'pointer' }}
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
            width: 32,
            height: 32,
            borderRadius: '50%',
            bottom: 8,
            right: 8,
            boxShadow: '0 0 6px rgba(0,0,0,0.15)',
          }}
        >
          <FaPen size={16} />
        </div>
      </div>

      {/* User Info and Buttons */}
      <div className="text-center w-100">
        <h5 className="mb-0">{user.first_name} {user.last_name}</h5>
        <small className="text-muted d-block mb-3">{user.email}</small>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleBackClick}
          className="mb-2 w-75"
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
    </>
  )}
</Col>

        {/* Main content */}
        <main className="flex-grow-1 overflow-auto p-4 main-content">

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
