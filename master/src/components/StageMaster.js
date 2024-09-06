import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container } from 'react-bootstrap';

const StageMaster = () => {
  const [stages, setStages] = useState([]);
  const [newStage, setNewStage] = useState({ Stage_name: '', Stage_Type: '' });
  const [notification, setNotification] = useState('');
  const [editingStage, setEditingStage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      updateStage();
    } else {
      addStage();
    }
  };

  const addStage = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/stage-master', newStage);
      setStages([...stages, response.data]);
      setNewStage({ Stage_name: '', Stage_Type: '' });
      setNotification('Stage added successfully');
    } catch (error) {
      console.error('Error adding stage:', error);
      if (error.response && error.response.status === 409) {
        setNotification('Stage Name already exists');
      } else {
        setNotification('Error adding stage');
      }
    } finally {
      setTimeout(() => setNotification(''), 3000);
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
      setNotification(response.data.message);
    } catch (error) {
      console.error('Error updating stage:', error);
      setNotification('Stage updated successfully');
    } finally {
      setTimeout(() => setNotification(''), 3000);
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

  return (
    <Container fluid>
      <h1>Stage Master</h1>
      <input
        type="text"
        placeholder="Search Stage Name..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-bar"
      />
      <form onSubmit={handleSubmit} className="form-container">
        <div>
          <label>Stage Name:</label>
          <input
            type="text"
            name="Stage_name"
            value={newStage.Stage_name}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div>
          <label>Stage Type:</label>
          <select
            name="Stage_Type"
            value={newStage.Stage_Type}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select Stage Type</option>
            {stageTypes.map((type, index) => (
              <option key={index} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button type="submit" className="form-button">
            {editingStage ? 'Update Stage' : 'Add Stage'}
          </button>
          {editingStage && (
            <button type="button" onClick={cancelEdit} className="form-button cancel-button">
              Cancel
            </button>
          )}
        </div>
      </form>
      {notification && (
        <div className="notification">
          <p>{notification}</p>
        </div>
      )}
      <table className="table-container">
        <thead>
          <tr>
            <th>Stage ID</th>
            <th>Stage Name</th>
            <th>Stage Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStages.map((stage) => (
            <tr key={stage.Stage_id}>
              <td>{stage.Stage_id}</td>
              <td>{stage.Stage_name}</td>
              <td>{stage.Stage_Type}</td>
              <td>
                <button onClick={() => editStage(stage)} className="form-button">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
      <style>{`
        .form-container {
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 10px;
          background-color: #e3f2fd;
          width: 550px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        }

        .form-input, .form-select {
          margin-bottom: 10px;
          padding: 10px;
          width: 100%;
          box-sizing: border-box;
          border-radius: 20px;
          border: 1px solid #ccc;
          outline: none;
          font-size: 15px;
          box-shadow: inset 0px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .form-select {
          cursor: pointer;
        }

        .form-button {
          padding: 12px 20px;
          background-color: #212F3D;
          color: #fff;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s ease;
          outline: none;
        }

        .cancel-button {
          margin-left: 10px;
          background-color: #5bc0de;
        }

        .table-container {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        }

        th {
          border-bottom: 2px solid #ddd;
          padding: 15px;
          text-align: left;
          background-color: #1F618D;
          color: #fff;
          font-size: 18px;
        }

        td {
          border-bottom: 1px solid #ddd;
          padding: 15px;
          font-size: 16px;
        }

        .search-bar {
          margin-bottom: 20px;
          padding: 12px 20px;
          width: 300px;
          float: right;
          border-radius: 25px;
          border: 1px solid #ccc;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
          outline: none;
          font-size: 15px;
          transition: box-shadow 0.3s ease;
        }

        .notification {
          background-color: #4CAF50;
          color: white;
          text-align: center;
          padding: 10px;
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1;
        }

        @media (max-width: 768px) {
          .form-container {
            width: 100%;
            padding: 15px;
          }

          .form-input, .form-select {
            font-size: 14px;
          }

          .form-button {
            padding: 10px 18px;
            font-size: 13px;
          }

          .search-bar {
            width: 100%;
            margin-bottom: 15px;
          }

          th, td {
            font-size: 16px;
            padding: 10px;
          }
        }
      `}</style>
    </Container>
  );
};

export default StageMaster;
