import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';

const ProfileEditModal = ({ show, onHide, user, setUser }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    pincode: '',
    city: '',
    district: '',
    state: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Initialize form and image preview when modal opens
  useEffect(() => {
    if (show && user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        pincode: user.pincode || '',
        city: user.city || '',
        district: user.district || '',
        state: user.state || '',

      });
      setImageFile(null);
      setConfirmDelete(false);
      setImagePreview(user.custom_user_profile || user.social_auth_pro_pic || null);
    }
  }, [show, user]);

  // Autofill city, district, state based on pincode
  useEffect(() => {
    const fetchAddress = async () => {
      if (form.pincode.length === 6) {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${form.pincode}`);
          const data = await res.json();
          const post = data?.[0]?.PostOffice?.[0];
          if (post) {
            setForm((prev) => ({
              ...prev,
              city: post.Name || '',
              district: post.District || '',
              state: post.State || '',
            }));
          } else {
            toast.warn('Invalid PIN code');
            setForm((prev) => ({ ...prev, city: '', district: '', state: '' }));
          }
        } catch {
          toast.error('Failed to fetch address');
        }
      } else {
        setForm((prev) => ({ ...prev, city: '', district: '', state: '' }));
      }
    };
    fetchAddress();
  }, [form.pincode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection + preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file || null);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(user.custom_user_profile || null);
    }
  };

  // Close modal and reset image states
  const handleClose = () => {
    setImageFile(null);
    setImagePreview(null);
    setConfirmDelete(false);
    onHide();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userFormData = new FormData();
      userFormData.append('first_name', form.first_name);
      userFormData.append('last_name', form.last_name);
      userFormData.append('phone_number', form.phone_number);
      userFormData.append('pincode', form.pincode);
      userFormData.append('city', form.city);
      userFormData.append('district', form.district);
      userFormData.append('state', form.state);
      
      if (imageFile) {
        userFormData.append('custom_user_profile', imageFile);
      } else if (imageFile === null && user.custom_user_profile) {
        userFormData.append('custom_user_profile', '');
      }

      const userRes = await axiosInstance.patch('auth/users/me/', userFormData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser({ ...userRes.data});
      toast.success('Profile updated successfully');
      handleClose();
    } catch (error) {
      console.error('Profile update failed:', error.response || error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('custom_user_profile', '');

      const res = await axiosInstance.patch('auth/users/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser(res.data);
      toast.success('Profile picture deleted');
      setConfirmDelete(false);
      handleClose();
    } catch {
      toast.error('Failed to delete picture');
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Main Edit Profile Modal */}
<Modal show={show} onHide={handleClose} centered scrollable>
  <Modal.Header closeButton>
    <Modal.Title>Edit Profile</Modal.Title>
  </Modal.Header>

  <Modal.Body>
  {/* Editable fields: First Name, Last Name, Phone, Pincode */}
  {[
    { label: 'First Name', name: 'first_name' },
    { label: 'Last Name', name: 'last_name' },
    { label: 'Phone Number', name: 'phone_number', type: 'tel' },
    { label: 'PIN Code', name: 'pincode' },
  ].map(({ label, name, type = 'text' }) => (
    <Form.Group className="mb-3" key={name}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        name={name}
        type={type}
        value={form[name]}
        onChange={handleInputChange}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </Form.Group>
  ))}

  {/* Auto-filled fields: City, District, State (Disabled) */}
  {['city', 'district', 'state'].map((field) => (
    <Form.Group className="mb-3" key={field}>
      <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
      <Form.Control value={form[field]} disabled />
    </Form.Group>
  ))}

  {/* Profile Picture Section: Only show if NOT social login */}
  {!user.social_auth_pro_pic && (
    <>
      <hr />
      <Form.Group className="mb-3">
        <Form.Label>Profile Picture</Form.Label>
        <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
      </Form.Group>

      {imagePreview && (
        <div className="mb-3 text-center">
          <Image
            src={imagePreview}
            alt="Profile Preview"
            roundedCircle
            style={{ width: 120, height: 120, objectFit: 'cover' }}
          />
        </div>
      )}

      {user.custom_user_profile && !imageFile && (
        <div className="text-center">
          <Button
            variant="danger"
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
          >
            Delete Picture
          </Button>
        </div>
      )}
    </>
  )}
</Modal.Body>


  <Modal.Footer>
    <Button variant="secondary" onClick={handleClose} disabled={saving}>
      Cancel
    </Button>
    <Button variant="success" onClick={handleSave} disabled={saving}>
      {saving ? <Spinner size="sm" animation="border" /> : 'Save Changes'}
    </Button>
  </Modal.Footer>
</Modal>

{/* Confirm Delete Modal */}
<Modal show={confirmDelete} onHide={() => setConfirmDelete(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Confirm Delete</Modal.Title>
  </Modal.Header>
  <Modal.Body>Are you sure you want to delete your profile picture?</Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={saving}>
      Cancel
    </Button>
    <Button variant="danger" onClick={handleDelete} disabled={saving}>
      Delete
    </Button>
  </Modal.Footer>
</Modal>

    </>
  );
};

export default ProfileEditModal;
