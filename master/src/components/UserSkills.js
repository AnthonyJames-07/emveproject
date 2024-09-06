import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Table, Spinner } from 'react-bootstrap';
import { BsTrash, BsDownload } from 'react-icons/bs';
import { FaSort } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const baseURL = 'http://localhost:5000/api';

const UserSkills = () => {
    const [departments, setDepartments] = useState([]);
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [stages, setStages] = useState([]);
    const [skills, setSkills] = useState([]);
    const [selectedStages, setSelectedStages] = useState([]);
    const [ratings, setRatings] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [userSkills, setUserSkills] = useState([]);
    const [sortedUserSkills, setSortedUserSkills] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchUserskill, setsearchUserskill] = useState('');
    const [notification, setNotification] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });


    useEffect(() => {
        fetchDepartments();
        fetchStages();
        fetchSkills();
        fetchUserSkills();
    }, []);

    useEffect(() => {
        let sortedArray = [...userSkills];
        if (sortConfig.key) {
            sortedArray.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        setSortedUserSkills(sortedArray);
    }, [sortConfig, userSkills]);

    const fetchDepartments = async () => {
        try {
            const response = await axios.get(`${baseURL}/departments`);
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchStages = async () => {
        try {
            const response = await axios.get(`${baseURL}/stagemaster`);
            setStages(response.data);
        } catch (error) {
            console.error('Error fetching stages:', error);
        }
    };

    const fetchSkills = async () => {
        try {
            const response = await axios.get(`${baseURL}/skillmaster`);
            setSkills(response.data);
        } catch (error) {
            console.error('Error fetching skills:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            if (selectedDepartments.length === 0) {
                setNotification('No dept selected, please select the dept');
            } else {
                console.log(selectedDepartments.length)
                const response = await axios.post(`${baseURL}/employees`, { departments: selectedDepartments });
                setEmployees(response.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleDepartmentChange = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setSelectedDepartments([...selectedDepartments, value]);
        } else {
            setSelectedDepartments(selectedDepartments.filter((deptId) => deptId !== value));
        }
    };

    const handleShowEmployees = async () => {
        setLoading(true);
        await fetchEmployees();
        setLoading(false);
    };

    const handleEmployeeChange = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setSelectedEmployees([...selectedEmployees, value]);
        } else {
            setSelectedEmployees(selectedEmployees.filter((empId) => empId !== value));
        }
    };

    const handleStageChange = (event, stageId) => {
        const { checked } = event.target;
        if (checked) {
            setSelectedStages([...selectedStages, stageId]);
        } else {
            setSelectedStages(selectedStages.filter((id) => id !== stageId));
        }
    };

    const handleRatingChange = (event, stageId) => {
        const { value } = event.target;
        setRatings({
            ...ratings,
            [stageId]: value,
        });
    };

    const handleSaveSkills = async () => {
        setLoading(true);
        try {
            const dataToSave = selectedEmployees.map((empId) => {
                const empSkills = selectedStages.map((stageId) => ({
                    stageId,
                    rating: ratings[stageId] || ''
                }));

                return {
                    employeeId: empId,
                    stages: empSkills
                };
            });
            if (dataToSave.length === 0) {
                setNotification('Error : Select employee or Select the Stage and Skills');
            } else {
                console.log('Data to save:', dataToSave);

                const response = await axios.post(`${baseURL}/save-skills`, { data: dataToSave });

                console.log('Skills saved successfully:', response.data);
                setMessage('Skills saved successfully!');

                // Re-fetch the data
                await fetchEmployees();
                setRatings({});
                setSelectedStages([]);
                fetchUserSkills();
            }
        } catch (error) {
            console.error('Error saving skills:', error);
            setMessage('Error saving skills.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        // Define headers for the Excel file
        const headers = ["User ID", "Name", "Stage Name", "Skill Description"];

        // Prepare the data with headers
        const data = filteredUserSkills.map(skill => [
            skill.USERID,
            skill.NAME,
            skill.STAGE_NAME,
            skill.Skill_Description
        ]);

        // Add the headers as the first row
        data.unshift(headers);

        // Convert data to worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(data);

        // Apply some styling to the worksheet (optional)
        worksheet['!cols'] = [
            { wpx: 100 },  // User ID column width
            { wpx: 150 },  // Name column width
            { wpx: 150 },  // Stage Name column width
            { wpx: 200 },  // Skill Description column width
        ];

        // Create a new workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "User Skills Details");

        // Write the workbook and download it
        XLSX.writeFile(workbook, "User_Skills_Details.xlsx");
    };

    const fetchUserSkills = async () => {
        try {
            const response = await axios.get(`${baseURL}/user-skills`);
            setUserSkills(response.data);
        } catch (error) {
            console.error('Error fetching user skills:', error);
        }
    };

    const handleDeleteSkill = async (userId) => {
        try {
            setLoading(true);
            await axios.delete(`${baseURL}/user-skills/${userId}`);
            setMessage('User skill deleted successfully');
            fetchUserSkills();
        } catch (error) {
            console.error('Error deleting user skill:', error);
            setMessage('Failed to delete user skill');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchUser = (e) => {
        setsearchUserskill(e.target.value);
    };

    const filteredEmployees = employees.filter((emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const filteredUserSkills = sortedUserSkills.filter((skill) =>
        skill.NAME.toLowerCase().includes(searchUserskill.toLowerCase()) ||
        skill.USERID.toString().includes(searchUserskill.toLowerCase()) ||
        skill.STAGE_NAME.toLowerCase().includes(searchUserskill.toLowerCase()) ||
        skill.Skill_Description.toLowerCase().includes(searchUserskill.toLowerCase())
    );

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        // Perform sorting logic here
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key === columnKey) {
            return <FaSort className={sortConfig.direction === 'asc' ? 'rotate-up' : 'rotate-down'} />;
        }
        return <FaSort />;
    };

    return (
        <Container fluid>
            <h2 className="mb-4">User Skills Management</h2>
            {message && <div className="alert alert-info">{message}</div>}
            <Row>
                <Col md={6}>
                    <Form.Group>
                        <Form.Label><h3>Select Departments:</h3></Form.Label>
                        <div className="checkbox-list">
                            {departments.map((dept) => (
                                <Form.Check
                                    key={dept.dptid}
                                    type="checkbox"
                                    label={dept.DeptName}
                                    value={dept.dptid}
                                    onChange={handleDepartmentChange}
                                />
                            ))}
                        </div>
                        <Button className="mt-2 btn btn-primary btn-lg" onClick={handleShowEmployees}
                            disabled={loading}>
                            Show Employees
                        </Button>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <h3>Employees</h3>
                    <Form.Control
                        type="text"
                        placeholder="Search employees"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="mb-3"
                    />
                    <div className="checkbox-list">
                        {filteredEmployees.map((emp) => (
                            <div key={emp.userid} className={`highlight-${searchTerm && emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 'active' : ''}`}>
                                <Form.Check
                                    type="checkbox"
                                    label={emp.name}
                                    value={emp.userid}
                                    onChange={handleEmployeeChange}
                                />
                            </div>
                        ))}
                    </div>
                </Col>
            </Row>
            <Row className="mt-4">
                <Col md={6}>
                    <h3>Selected Employees</h3>
                    <div className="selected-employees">
                        <Table striped bordered hover>
                            <thead className="thead-dark">
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Date of Joining</th>
                                    <th>Designation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedEmployees.map((empId) => {
                                    const employee = employees.find((emp) => emp.userid === empId);
                                    return (
                                        employee && (
                                            <tr key={empId}>
                                                <td>{employee.userid}</td>
                                                <td>{employee.name}</td>
                                                <td>{employee.Enrolldt ? new Date(employee.Enrolldt).toLocaleDateString('en-GB') : " - "}</td>
                                                <td>{employee.designation}</td>
                                            </tr>
                                        )
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="stages-skills-header">
                        <h3>Stages and Skills</h3>
                        <Button className="btn btn-success btn-lg text-uppercase" onClick={handleSaveSkills}
                            disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : 'Save'}
                        </Button>
                    </div>
                    <div className="stages-skills">
                        <table className="table table-bordered">
                            <thead className="thead-dark">
                                <tr>
                                    <th>Stage Name</th>
                                    <th>Skill Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stages.map((stage) => (
                                    <tr key={`stage-${stage.Stage_id}`}>
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                label={stage.Stage_name}
                                                onChange={(e) => handleStageChange(e, stage.Stage_id)}
                                                checked={selectedStages.includes(stage.Stage_id)}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                className="form-control mt-2"
                                                onChange={(e) => handleRatingChange(e, stage.Stage_id)}
                                                value={ratings[stage.Stage_id] || ''}>
                                                <option value="">Select Rating</option>
                                                {skills.map((skill) => (
                                                    <option key={skill.Skill_id} value={skill.Skill_id}>
                                                        {skill.Skill_Description}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Col>
            </Row>
            <Row className="mt-4">
                <Col md={12}>
                    <div className="user-skills-header">
                        <h2>User Skills Details</h2>
                        <div className="user-skills-actions">
                            <Form.Group>
                                <Form.Control
                                    type="text"
                                    placeholder="Search for User Skills details"
                                    value={searchUserskill}
                                    onChange={handleSearchUser}
                                />
                            </Form.Group>
                            <Button variant="success" onClick={handleDownload}>
                                <BsDownload /> Download
                            </Button>
                        </div>
                    </div>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('USERID')}>
                                    User ID&nbsp;&nbsp;
                                    <SortIcon columnKey="USERID" />
                                </th>
                                <th onClick={() => handleSort('NAME')}>
                                    Name&nbsp;&nbsp;
                                    <SortIcon columnKey="NAME" />
                                </th>
                                <th onClick={() => handleSort('STAGE_NAME')}>
                                    Stage Name&nbsp;&nbsp;
                                    <SortIcon columnKey="STAGE_NAME" />
                                </th>
                                <th onClick={() => handleSort('Skill_Description')}>
                                    Skill Description&nbsp;&nbsp;
                                    <SortIcon columnKey="Skill_Description" />
                                </th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUserSkills.map((skill) => (
                                <tr key={`${skill.USERID}-${skill.STAGE_NAME}`}>
                                    <td>{skill.USERID}</td>
                                    <td>{skill.NAME}</td>
                                    <td>{skill.STAGE_NAME}</td>
                                    <td>{skill.Skill_Description}</td>
                                    <td className="text-center">
                                        <Button variant="danger" onClick={() => handleDeleteSkill(skill.USERID)}>
                                            <BsTrash style={{ fontSize: '1.5em' }} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
            {notification && (
                <div className="notification">
                    {notification}
                </div>
            )}
            <style>
                {`
        .checkbox-list {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
        }

        .highlight-active {
            background-color: #a9dfbf;
        }

        .selected-employees {
            max-height: 260px;
            overflow-y: auto;
        }

        .stages-skills {
            max-height: 240px;
            overflow-y: auto;
        }

        .stages-skills-header, .user-skills-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
        }

        .user-skills-actions {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 10px;
            margin-bottom: 3px;
            min-width: 300px;
            max-width: 600px;
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
            .checkbox-list, .selected-employees, .stages-skills {
                max-height: 150px;
                padding: 8px;
            }

            .user-skills-actions {
                flex-direction: column;
                align-items: stretch;
            }

            .stages-skills-header, .user-skills-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .notification {
                font-size: 12px;
                padding: 8px;
            }
        }
        `}
            </style>
        </Container>

    );
};

export default UserSkills;
