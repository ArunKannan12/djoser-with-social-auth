import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {jwtDecode} from 'jwt-decode';
import { Modal, Button } from 'react-bootstrap';
import { FaPen } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
  const fetchProfile = async () => {
   
    try {
      const res = await axiosInstance.get('auth/users/me/');
      setUser(res.data);
    } catch (error) {
      console.error('Error during token refresh or profile fetch:', error);
      localStorage.clear();
      navigate('/login');
    }
  };

 fetchProfile();
}, [navigate]);


  const handleLogout = async () => {
   
    const refresh = localStorage.getItem('refresh');

    try {
      await axiosInstance.post('auth/jwt/logout/',{ refresh });
    } catch {
      localStorage.clear();
      toast.info('Logged out successfully');
      navigate('/login');
    }
  };

  const onFileChange = (e) => {
    if (e.target.files.length > 0) setImageFile(e.target.files[0]);
  };

  const uploadProfilePicture = async () => {
    if (!imageFile) return toast.warning('Please select an image.');
    setUploading(true);
    const formData = new FormData();
    formData.append('custom_user_profile', imageFile);

    try {
      const res = await axiosInstance.patch('auth/users/me/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(res.data);
      toast.success('Profile picture updated!');
      setImageFile(null);
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to upload picture.');
    } finally {
      setUploading(false);
    }
  };

  const deleteProfilePicture = async () => {
    try {
      const res = await axiosInstance.patch(
        'auth/users/me/',
        { custom_user_profile: null },
        {
          headers: { 'Content-Type': 'application/json' }, // content-type override is fine here
        }
      );
      setUser(res.data);
      toast.success('Profile picture deleted.');
      setShowDeleteConfirm(false);
      setShowModal(false);
    } catch (err) {
      toast.error('Delete failed.');
      setShowDeleteConfirm(false);
    }
};


  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      <div className="d-flex">
        {/* Sidebar */}
        <div
          className="bg-light border-end vh-100"
          style={{
            width: sidebarOpen ? '250px' : '60px',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
          }}
        >
          <div className="p-3">
            <button
              className="btn btn-sm btn-outline-secondary mb-3"
              onClick={toggleSidebar}
              title="Toggle Sidebar"
            >
              &#9776;
            </button>

            {sidebarOpen && user && (
              <>
                <div className="text-center mb-2 position-relative">
                  <img
                    src={
                      user.custom_user_profile
                        ? user.custom_user_profile
                        : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                    }
                    alt="Profile"
                    style={{ width: 100, height: 100, borderRadius: '50%' }}
                  />
                  <button
                    className="btn btn-sm btn-light position-absolute"
                    style={{ bottom: 0, right: '35%', borderRadius: '50%' }}
                    onClick={() => setShowModal(true)}
                    title="Edit Picture"
                  >
                    <FaPen size={12} />
                  </button>
                </div>
                <h6 className="text-center">
                  {user.first_name} {user.last_name}
                </h6>
                <hr />

                <button className="btn btn-dark w-100 mt-2" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Display */}
        <div className="flex-grow-1 p-4">
          <h3 className="mb-4">Profile Details</h3>
          {user ? (
            <div className="card shadow p-4">
              <div className="mb-3 text-center">
                <img
                  src={
                    user.custom_user_profile
                      ? user.custom_user_profile
                      : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                  }
                  alt="Profile"
                  style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <p>
                <strong>First Name:</strong> {user.first_name}
              </p>
              <p>
                <strong>Last Name:</strong> {user.last_name}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
            </div>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>
      </div>

      {/* Modal for Edit Profile Picture */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile Picture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="form-control mb-3"
          />
          <Button variant="primary" onClick={uploadProfilePicture} disabled={uploading} className="me-2">
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>

          {/* Delete button shown only if user has a profile picture */}
          {user?.custom_user_profile && (
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete Picture
            </Button>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete your profile picture?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={deleteProfilePicture}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Profile;
