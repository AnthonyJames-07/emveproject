import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const SkillMaster = () => {
  const [skills, setSkills] = useState([]);
  const [skill, setSkill] = useState({
    Skill_Rating: '',
    Skill_Description: ''
  });
  const [notification, setNotification] = useState('');
  const [editingSkill, setEditingSkill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/skill-master');
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setNotification('Error fetching skills');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSkill({ ...skill, [name]: value });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSkill) {
        await updateSkill();
      } else {
        await addSkill();
      }
    } catch (error) {
      console.error('Error submitting skill:', error);
      setNotification('Error submitting skill');
    }
  };

  const addSkill = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/skill-master', skill);
      setSkills([...skills, response.data]);
      setSkill({ Skill_Rating: '', Skill_Description: '' });
      setNotification('Skill added successfully');
    } catch (error) {
      console.error('Skill already exists:', error);
      setNotification('Skill already exists');
    } finally {
      setLoading(false);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const updateSkill = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/skill-master/${editingSkill.Skill_id}`, skill);
      const updatedSkills = skills.map(s => (s.Skill_id === editingSkill.Skill_id ? response.data : s));
      setSkills(updatedSkills);
      setSkill({ Skill_Rating: '', Skill_Description: '' });
      setEditingSkill(null);
      setNotification('Skill updated successfully');
    } catch (error) {
      console.error('Error updating skill:', error);
      setNotification('Error updating skill');
    } finally {
      setLoading(false);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const editSkill = (selectedSkill) => {
    setSkill({ Skill_Rating: selectedSkill.Skill_Rating, Skill_Description: selectedSkill.Skill_Description });
    setEditingSkill(selectedSkill);
  };

  const cancelEdit = () => {
    setSkill({ Skill_Rating: '', Skill_Description: '' });
    setEditingSkill(null);
  };

  const filteredSkills = skills.filter(skill =>
    skill.Skill_Description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid>
      <h1>Skill Master</h1>
      <input
        type="text"
        placeholder="Search Skill..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="searchStyle"
      />
      <form onSubmit={handleSubmit} className="formStyle">
        <div>
          <label>Skill Rating:</label>
          <select
            name="Skill_Rating"
            value={skill.Skill_Rating}
            onChange={handleChange}
            className="inputStyle"
            required
          >
            <option value="">Select Rating</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        <div>
          <label>Skill Description:</label>
          <input
            type="text"
            name="Skill_Description"
            value={skill.Skill_Description}
            onChange={handleChange}
            className="inputStyle"
            required
          />
        </div>
        <button type="submit" className="buttonStyle" disabled={loading}>
          {editingSkill ? 'Update Skill' : 'Add Skill'}
        </button>
        {editingSkill && (
          <button type="button" onClick={cancelEdit} className="buttonStyle" style={{ backgroundColor: '#6c757d', marginLeft: '10px' }}>
            Cancel
          </button>
        )}
      </form>

      <table className="tableStyle">
        <thead>
          <tr>
            <th className="thStyle">Skill ID</th>
            <th className="thStyle">Skill Rating</th>
            <th className="thStyle">Skill Description</th>
            <th className="thStyle">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSkills.map((skill) => (
            <tr key={skill.Skill_id}>
              <td className="tdStyle">{skill.Skill_id}</td>
              <td className="tdStyle">{skill.Skill_Rating}</td>
              <td className="tdStyle">{skill.Skill_Description}</td>
              <td className="tdStyle">
                <button onClick={() => editSkill(skill)} className="buttonStyle">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .searchStyle {
          margin-bottom: 20px;
          padding: 12px 20px;
          width: 300px;
          float: right;
          border-radius: 25px;
          border: 1px solid #ccc;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
          outline: none;
          font-size: 16px;
          transition: box-shadow 0.3s ease;
        }
        .formStyle {
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 10px;
          background-color: #e3f2fd;
          width: 100%;
          max-width: 550px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        }
        .inputStyle {
          margin-bottom: 10px;
          padding: 10px;
          width: 100%;
          box-sizing: border-box;
          border-radius: 20px;
          border: 1px solid #ccc;
          outline: none;
          font-size: 16px;
          box-shadow: inset 0px 2px 4px rgba(0, 0, 0, 0.1);
        }
        .buttonStyle {
          padding: 12px 20px;
          background-color: #212F3D;
          color: #fff;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s ease;
          outline: none;
        }
        .tableStyle {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
        }
        .thStyle {
          border-bottom: 2px solid #ddd;
          padding: 15px;
          text-align: left;
          background-color: #1F618D;
          color: #fff;
          font-size: 18px;
        }
        .tdStyle {
          border-bottom: 1px solid #ddd;
          padding: 15px;
          font-size: 16px;
        }
        /* Media Queries */
        @media (max-width: 768px) {
          .formStyle {
            width: 100%;
            padding: 15px;
          }
          .searchStyle {
            width: 100%;
            margin-bottom: 10px;
          }
          .buttonStyle {
            width: 100%;
            margin-top: 10px;
          }
          .tableStyle {
            font-size: 14px;
          }
          .thStyle, .tdStyle {
            padding: 10px;
          }
        }
      `}</style>

      {notification && (
        <div style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          textAlign: 'center',
          padding: '10px',
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: '1',
        }}>
          {notification}
        </div>
      )}
        </Container >

  );
};

export default SkillMaster;
