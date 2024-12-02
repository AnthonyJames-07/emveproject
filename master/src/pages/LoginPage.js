import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Container, Card, Alert } from 'react-bootstrap';
import axios from 'axios';
import { styled } from '@mui/system';
import { Typography } from '@mui/material';
import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../styles/LoginPage.css';

const StyledCard = styled(Card)({
  background: '#1A2226',
  borderRadius: '15px',
  border: 'none',
  boxShadow: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
});

const InputField = styled(Form.Control)({
  backgroundColor: '#ECF0F5',
  border: 'none',
  borderBottom: '2px solid #6C6C6C',
  borderRadius: '0px',
  fontWeight: 'bold',
  outline: 0,
  marginBottom: '20px',
  color: '#333',
  '&::placeholder': {
    color: '#888',
  },
});

const LoginButton = styled(Button)(({
  backgroundColor: 'transparent',
  borderColor: '#0DB8DE',
  color: '#0DB8DE',
  borderRadius: '0px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  '&:hover': {
    backgroundColor: '#0DB8DE',
  },
}));

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isValid, setIsValid] = useState({ userId: null, password: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [passwordTimeout, setPasswordTimeout] = useState(null); // State for timeout
  const navigate = useNavigate();

  const validateUserId = (value) => {
    const isValidUserId = value.length >= 3;
    setIsValid((prevState) => ({ ...prevState, userId: isValidUserId }));
    setUserId(value);
  };

  // Validate password (at least 8 characters with a number)
  const validatePassword = (value) => {
    const passwordValid = value.length >= 8 && /\d/.test(value);
    setIsValid((prevState) => ({ ...prevState, password: passwordValid }));
    setPassword(value);

    if (!passwordValid) {
      setAlertMessage('Password is required !...');
      
      // Clear previous timeout if any
      if (passwordTimeout) clearTimeout(passwordTimeout);
      
      // Set timeout to clear the alert message
      const timer = setTimeout(() => {
        setAlertMessage('');
      }, 2000);
      
      // Store the timer ID so it can be cleared later
      setPasswordTimeout(timer);
    } else {
      setAlertMessage('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isValid.userId && isValid.password) {
      setLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/api/login', {
          userId,
          password,
        });

        if (response.data.success) {
          sessionStorage.setItem('authToken', response.data.token);
          navigate('/home');
        } else {
          setAlertMessage('');
        }
      } catch (error) {
        setAlertMessage('');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please provide valid userId and password.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      return;
    }
    console.log(userId, oldPassword, newPassword);
    try {
      const response = await axios.post('http://localhost:5000/api/change-password', {
        userId,
        oldPassword,
        newPassword,
      });

      const data = response.data;

      if (data.success) {
        setMessage('Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage('An error occurred.');
      console.error('Error:', error);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', maxWidth: '100%', background: '#222D32' }}>
      <StyledCard class='p-4 login-box'>
        <div class='col-lg-12 login-key'>
          <i class="fa fa-key" aria-hidden="true"></i>
        </div>
        <Typography variant="h4" align="center" gutterBottom style={{ color: '#ECF0F5' }}>
          {showChangePassword ? 'CHANGE PASSWORD' : 'LOGIN'}
        </Typography>
        <div class='col-lg-12 login-form'>

          {!showChangePassword ? (
            <Form noValidate onSubmit={handleLogin} class="mb-3">
              <Form.Group controlId="formUserId">
                <Form.Label class='form-control-label' style={{ color: '#6C6C6C' }}>
                  User ID
                </Form.Label>
                <InputField
                  type="text"
                  placeholder="Enter User ID"
                  required
                  value={userId}
                  onChange={(e) => validateUserId(e.target.value)}
                  style={{
                    borderColor: isValid.userId === null ? 'gray' : isValid.userId ? 'green' : 'red',
                  }}
                />
                {isValid.userId === false && (
                  <p class='error' style={{ color: 'red' }}>User ID is required !..</p>
                )}
              </Form.Group>

              <Form.Group controlId="formPassword">
                <Form.Label class='form-control-label' style={{ color: '#6C6C6C' }}>
                  Password
                </Form.Label>
                <InputField
                  type="password"
                  placeholder="Enter Password"
                  required
                  value={password}
                  onChange={(e) => validatePassword(e.target.value)}
                  style={{
                    borderColor: isValid.password === null ? 'gray' : isValid.password ? 'green' : 'red',
                  }}
                />
              </Form.Group>
              {alertMessage && <p class='alert' style={{ color: 'red' }}>{alertMessage}</p>}
              {error && (
                <Alert variant="danger" className="text-center mb-3" style={{background:'#f8d7da', color:'#58151c'}}>
                  {error}
                </Alert>
              )}
              <div class='loginbttm'>
                <div class='login-button'>
                  <LoginButton
                    class='w-100'
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Logging In...' : 'Login'}
                  </LoginButton>
                </div>
              </div>
            </Form>
          ) : (
            <Form noValidate onSubmit={handleChangePassword}>
              <Form.Group controlId="formOldPassword">
                <Form.Label class='form-control-label' style={{ color: '#6C6C6C' }}>
                  Old Password
                </Form.Label>
                <InputField
                  type="password"
                  placeholder="Enter Old Password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="formNewPassword">
                <Form.Label class='form-control-label' style={{ color: '#6C6C6C' }}>
                  New Password
                </Form.Label>
                <InputField
                  type="password"
                  placeholder="Enter New Password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="formConfirmPassword">
                <Form.Label class='form-control-label' style={{ color: '#6C6C6C' }}>
                  Confirm Password
                </Form.Label>
                <InputField
                  type="password"
                  placeholder="Confirm New Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Form.Group>
              {message && (
                <Alert variant="info" className="text-center mb-3" style={{background:'#f8d7da', color:'#58151c'}}>
                  {message}
                </Alert>
              )}
              <div class='loginbttm'>
                <div class='login-button'>
                  <LoginButton class="w-100" type="submit">
                    Change Password
                  </LoginButton>
                </div>
              </div>
            </Form>
          )}
        </div>
      </StyledCard>
    </Container>
  );
};

export default LoginPage;
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Button, Form,Container, Card, Alert } from 'react-bootstrap'; // Import Bootstrap components
// import axios from 'axios';
// import { Typography,TextField } from '@mui/material'; // Import Typography for Material-UI
// import 'font-awesome/css/font-awesome.min.css'; // Import Font Awesome for icons
// import '@fortawesome/fontawesome-free/css/all.min.css';
// import '../styles/LoginPage.css';

// const LoginPage = () => {
//   const [userId, setUserId] = useState('');
//   const [password, setPassword] = useState('');
//   //const [isValid, setIsValid] = useState({ userId: null, password: null });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false); // Loading state
//   const [alertMessage, setAlertMessage] = useState('');
//   const [showChangePassword, setShowChangePassword] = useState(false); // State for toggling Change Password form
//   const [oldPassword, setOldPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [message, setMessage] = useState('');
//   const navigate = useNavigate();

//   const validateUserId = (value) => {
//     if (value.length === 0) {
//       setTimeout(() => {
//         setAlertMessage('User ID is required!');
//       }, 200);
//     }
//     setUserId(value);
//   };

//   const validatePassword = (value) => {
//     if (value.length === 0) {
//       setTimeout(() => {
//         setAlertMessage('Password is required!');
//       }, 200);
//     }
//     setPassword(value);
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
  
//     if (userId.length === 0 || password.length === 0) {
//       setTimeout(() => {
//         setError('Please provide valid userId and password.');
//       }, 200);  // Delay error display by 200ms
//     } else {
//       setLoading(true);
//       try {
//         const response = await axios.post('http://localhost:5000/api/login', {
//           userId,
//           password,
//         });
  
//         if (response.data.success) {
//           sessionStorage.setItem('authToken', response.data.token);
//           navigate('/home');
//         } else {
//           setError(response.data.message || 'Invalid user ID or password.');
//         }
//       } catch (error) {
//         // Log unexpected errors only in development mode
//         if (process.env.NODE_ENV === 'development') {
//           console.error('Login error:', error);
//         }
//         setError('An error occurred. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     }
//   };
  
//   // Handle password change form submission
//   const handleChangePassword = async (e) => {
//     e.preventDefault();
//     if (newPassword !== confirmPassword) {
//       setMessage('New passwords do not match.');
//       return;
//     }
//     console.log(userId, oldPassword, newPassword);
//     try {
//       const response = await axios.post('http://localhost:5000/api/change-password', {
//         userId,
//         oldPassword,
//         newPassword,
//       });

//       // No need for response.json() with Axios
//       const data = response.data;

//       if (data.success) {
//         setMessage('Password changed successfully!');
//         setOldPassword('');
//         setNewPassword('');
//         setConfirmPassword('');
//         // Wait for 2 seconds before redirecting (optional)
//         setTimeout(() => {
//           navigate('/home');  // Redirect to the login page (or '/home')
//         }, 1000);
//       } else {
//         setMessage(data.message);
//       }
//     } catch (error) {
//       setMessage('An error occurred.');
//       console.error('Error:', error);
//     }
//   };

//   return (
//     <Container className="container">
//     <Card className="login-box">
//       <div className="col-lg-12 login-key">
//         <i className="fa fa-key" aria-hidden="true"></i>
//       </div>
//       <Typography variant="h4" align="center" gutterBottom style={{ color: '#ECF0F5' }}>
//         {showChangePassword ? 'CHANGE PASSWORD' : 'LOGIN'}
//       </Typography>
//       <div className="col-lg-12 login-form">
//         {!showChangePassword ? (
//           <Form noValidate onSubmit={handleLogin}>
//             <Form.Group controlId="formUserId">
//               <Form.Label>User ID</Form.Label>
//               <TextField
//                 placeholder="Enter User ID"
//                 className="input-field"
//                 value={userId}
//                 onChange={(e) => validateUserId(e.target.value)}
//                 required
//                 fullWidth
//                 margin="normal"
//               />
//             </Form.Group>
//             <Form.Group controlId="formPassword">
//               <Form.Label>Password</Form.Label>
//               <Form.Control
//                 type="password"
//                 placeholder="Enter Password"
//                 className="input-field"
//                 value={password}
//                 onChange={(e) => validatePassword(e.target.value)}
//               />
//             </Form.Group>
//             {alertMessage && <p className="alert">{alertMessage}</p>}
//             {error && (
//               <Alert variant="danger" className="text-center mb-3">
//                 {error}
//               </Alert>
//             )}
//             <Button className="w-100 login-button" type="submit" disabled={loading}>
//               {loading ? 'Logging In...' : 'LOGIN'}
//             </Button>
//           </Form>
//         ) : (
//           <Form noValidate onSubmit={handleChangePassword} className="mb-3">
//             <Form.Group controlId="formOldPassword">
//               <Form.Label>OLD PASSWORD</Form.Label>
//               <Form.Control
//                 type="password"
//                 placeholder="Enter Old Password"
//                 className="input-field"
//                 value={oldPassword}
//                 onChange={(e) => setOldPassword(e.target.value)}
//               />
//             </Form.Group>
//             <Form.Group controlId="formNewPassword">
//               <Form.Label>NEW PASSWORD</Form.Label>
//               <Form.Control
//                 type="password"
//                 placeholder="Enter New Password"
//                 className="input-field"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//               />
//             </Form.Group>
//             <Form.Group controlId="formConfirmPassword">
//               <Form.Label>CONFIRM NEW PASSWORD</Form.Label>
//               <Form.Control
//                 type="password"
//                 placeholder="Confirm New Password"
//                 className="input-field"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//               />
//             </Form.Group>
//             {message && (
//               <Alert variant="info" className="text-center mb-3">
//                 {message}
//               </Alert>
//             )}
//             <Button className="w-100 login-button" type="submit" disabled={loading}>
//               {loading ? 'Changing Password...' : 'CHANGE PASSWORD'}
//             </Button>
//           </Form>
//         )}
//         <div className="text-center">
//           <Button variant="link" onClick={() => setShowChangePassword(!showChangePassword)}>
//             {showChangePassword ? 'Back to Login' : 'Change Password'}
//           </Button>
//         </div>
//       </div>
//     </Card>
//   </Container>
// );
// };

// export default LoginPage;
