import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Table, InputGroup, FormControl, Button } from 'react-bootstrap';
import { TextField, Select, MenuItem, Snackbar, Typography } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import '../styles/StageMaster.css';
import emvLogo from '../pictures/emvlogo.png';
import { MdEdit } from 'react-icons/md';


const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const StageMaster = () => {
  const [stages, setStages] = useState([]);
  const [newStage, setNewStage] = useState({ Stage_name: '', Stage_Type: '' });
  const [notification, setNotification] = useState('');
  const [editingStage, setEditingStage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const stageTypes = ['Prelamination', 'Laminator & Framing Line', 'Testing & Packing Line'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/stage-master');
      setStages(response.data);
    } catch (error) {
      console.error('Error fetching stage data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewStage({ ...newStage, [name]: value });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingStage) {
      await updateStage();
    } else {
      await addStage();
    }
  };

  const addStage = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/stage-master', newStage);
      setStages([...stages, response.data]);
      setNewStage({ Stage_name: '', Stage_Type: '' });
      setNotification('Stage added successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding stage:', error);
      setNotification(error.response?.status === 409 ? 'Stage Name already exists' : 'Error adding stage');
      setSnackbarOpen(true);
    }
  };

  const updateStage = async () => {
    try {
      const response = await axios.put(`http://localhost:5000/api/stage-master/${editingStage.Stage_id}`, newStage);
      const updatedStages = stages.map(stage =>
        stage.Stage_id === editingStage.Stage_id ? response.data : stage
      );
      setStages(updatedStages);
      setNewStage({ Stage_name: '', Stage_Type: '' });
      setEditingStage(null);
      setNotification('Stage updated successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating stage:', error);
      setNotification('Error updating stage');
      setSnackbarOpen(true);
    }
  };

  const editStage = (stage) => {
    setNewStage({ Stage_name: stage.Stage_name, Stage_Type: stage.Stage_Type });
    setEditingStage(stage);
  };

  const cancelEdit = () => {
    setNewStage({ Stage_name: '', Stage_Type: '' });
    setEditingStage(null);
  };

  const filteredStages = stages.filter(stage =>
    stage.Stage_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container fluid
      className="container-fluid"
      style={{ backgroundImage: `url(${emvLogo})`, backgroundSize: 'auto', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', minHeight: 'auto', opacity: '0.9' }}>
      <Typography variant="h4" align="left" gutterBottom>
        Stage Master
      </Typography>

      <form onSubmit={handleSubmit} className="form-container">
        <TextField
          label="Stage Name"
          name="Stage_name"
          value={newStage.Stage_name}
          onChange={handleChange}
          className="form-input"
          required
          fullWidth
          margin="normal"
        />
        <Select
          name="Stage_Type"
          value={newStage.Stage_Type}
          onChange={handleChange}
          className="form-select"
          displayEmpty
          fullWidth
          required
        >
          <MenuItem value="">Select Stage Type</MenuItem>
          {stageTypes.map((type, index) => (
            <MenuItem key={index} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>&nbsp;
        <div className="button-group">
          <Button type="submit" variant="contained" color="primary" className="form-button">
            {editingStage ? 'Update Stage' : 'Add Stage'}
          </Button>
          {editingStage && (
            <Button variant="outlined" onClick={cancelEdit} className="form-button">
              Cancel
            </Button>
          )}
        </div>
        <div className="d-flex justify-content-end mb-3">
          <InputGroup className="input-group" style={{ width: '600px' }}>
            <FormControl
              placeholder="Search Stage Name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-bar"
            />
          </InputGroup>
        </div>
      </form>
      <Table striped bordered hover responsive className="table-container tableStyle">
        <thead>
          <tr>
            <th className="thStyle">Stage ID</th>
            <th className="thStyle">Stage Name</th>
            <th className="thStyle">Stage Type</th>
            <th className="thStyle">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStages.map((stage, index) => (
            <tr key={stage.Stage_id} style={{ '--animation-order': index }}>
              <td className="tdStyle">{stage.Stage_id}</td>
              <td className="tdStyle">{stage.Stage_name}</td>
              <td className="tdStyle">{stage.Stage_Type}</td>
              <td className="tdStyle">
                
                <Button onClick={() => editStage(stage)} variant="warning" size="lg">
                <MdEdit style={{ marginRight: '5px' }} /> 
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {notification}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StageMaster;
