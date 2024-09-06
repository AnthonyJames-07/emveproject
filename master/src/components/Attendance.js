import React, { useState, useEffect, useCallback } from 'react';
import { Form, Container, Row, Col, Table, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { DateTime } from 'luxon';
import { FaDownload } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LabelList
} from 'recharts';



const Attendance = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedShifts, setSelectedShifts] = useState([]);
    const [selectedLines, setSelectedLines] = useState([]);
    const [shiftOptions, setShiftOptions] = useState([]);
    const [lineOptions, setLineOptions] = useState([]);
    const [attendanceDetails, setAttendanceDetails] = useState([]);
    const [detailedRecords, setDetailedRecords] = useState([]);
    const [detailType, setDetailType] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const [showAllDetails, setShowAllDetails] = useState(false);
    const [loadingShifts, setLoadingShifts] = useState(false);
    const [loadingLines, setLoadingLines] = useState(false);
    const [loading, setLoading] = useState(false);
    //const [selectedEmployees, setSelectedEmployees] = useState({});
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [swapPopup, setSwapPopup] = useState(false);
    const [swapEmployees, setSwapEmployees] = useState([]);  // Holds fetched employee data
    const [selectedRecord, setSelectedRecord] = useState(null);  // Holds the selected user record
    const [showGraph, setShowGraph] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");


    useEffect(() => {
        const fetchOptions = async () => {
            setLoadingShifts(true);
            setLoadingLines(true);
            try {
                const shiftResponse = await axios.get('http://localhost:5000/api/shifts');
                const lineResponse = await axios.get('http://localhost:5000/api/lines'); // Ensure this matches your server-side endpoint
                setShiftOptions(shiftResponse.data);
                setLineOptions(lineResponse.data);
            } catch (error) {
                console.error('Error fetching options:', error);
            } finally {
                setLoadingShifts(false);
                setLoadingLines(false);
            }
        };
        fetchOptions();
    }, []);


    const fetchAttendanceDetails = useCallback(async () => {
        const formattedDate = formatDate(selectedDate);
        setLoadingDetails(true);
        try {
            const response = await axios.get('http://localhost:5000/api/attendance', {
                params: {
                    date: formattedDate,
                    shifts: selectedShifts.join(','), // "S1,S2"
                    lines: selectedLines.join(','),   // "3A,2"
                },
            });
            setAttendanceDetails(response.data);
        } catch (error) {
            console.error('Error fetching attendance details:', error);
        } finally {
            setLoadingDetails(false);
        }
    }, [selectedDate, selectedShifts, selectedLines]);

    const fetchDetailedRecords = async (type, shiftId, stageName, LINE) => {
        const formattedDate = formatDate(selectedDate);
        setLoadingRecords(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/attendance/${type}`, {
                params: {
                    date: formattedDate,
                    shiftId: shiftId.trim(),
                    stageName: stageName.trim(),
                    line: LINE.trim(),
                },
            });
            setDetailedRecords(response.data);
            setDetailType(type);
            setShowAllDetails(false);
        } catch (error) {
            console.error(`Error fetching ${type} records:`, error);
        } finally {
            setLoadingRecords(false);
        }
    };

    const handleCheckboxChange = (event, setSelectedItems, selectedItems) => {
        const value = event.target.value;
        if (event.target.checked) {
            setSelectedItems([...selectedItems, value]);
        } else {
            setSelectedItems(selectedItems.filter((item) => item !== value));
        }
    };

    const handleLineChange = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setSelectedLines([...selectedLines, value]);
        } else {
            setSelectedLines(selectedLines.filter((line) => line !== value));
        }
    };

    const formatDate = (date) => {
        return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');
    };

    const parseDate = (dateString) => {
        const date = DateTime.fromFormat(dateString, 'yyyy-MM-dd').toJSDate();
        return isNaN(date.getTime()) ? new Date() : date; // Fallback to current date if invalid
    };

    const handleDateChange = (e) => {
        const newDate = parseDate(e.target.value);
        setSelectedDate(newDate);
    };

    const handleButtonClick = () => {
        handleShowRecords();
        setShowGraph(prev => !prev);
    };

    const handleShowRecords = () => {
        if (selectedShifts.length > 0 && selectedLines.length > 0) {
            setShowTable(true);
            setShowAllDetails(false);
            fetchAttendanceDetails();
        } else {
            alert('Please select at least one shift and one line.');
        }
    };

    const handleShowAll = async () => {
        const formattedDate = formatDate(selectedDate);
        setLoadingDetails(true);
        setShowTable(true);
        setShowAllDetails(true);
        try {
            const response = await axios.get('http://localhost:5000/api/attendance/showAll', {
                params: {
                    date: formattedDate,
                    shifts: selectedShifts.join(','), // Join selected shifts
                    lines: selectedLines.join(','),   // Join selected lines
                },
            });
            setDetailedRecords(response.data);
            setDetailType('showAll');
        } catch (error) {
            console.error('Error fetching all records:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    // const calculateTotals = () => {
    //     const totals = attendanceDetails.reduce(
    //         (acc, detail) => {
    //             acc.allot += detail.ALLOT || 0;
    //             acc.present += detail.PRESENT || 0;
    //             acc.absent += detail.ABSENT || 0;
    //             return acc;
    //         },
    //         { allot: 0, present: 0, absent: 0 }
    //     );
    //     return totals;
    // };

    // const totals = calculateTotals();
    const calculateTotals = () => {
        const totals = attendanceDetails.reduce(
            (acc, detail) => {
                acc.allot += detail.ALLOT || 0;
                acc.present += detail.PRESENT || 0;
                acc.absent += detail.ABSENT || 0;
                return acc;
            },
            { allot: 0, present: 0, absent: 0 }
        );
        return totals;
    };

    const totals = calculateTotals();


    const downloadPdf = () => {
        // Map the attendance details to an array of arrays for PDF
        const data = attendanceDetails.map(record => [
            record.Stage_name,
            record.SHIFT_ID,
            record.LINE,
            record.ALLOT,
            record.PRESENT,
            record.ABSENT,
        ]);

        // Calculate totals
        const totals = calculateTotals();
        const totalRow = [
            'Totals',
            '',
            '',
            totals.allot,
            totals.present,
            totals.absent,
        ];

        // Create a new jsPDF instance
        const doc = new jsPDF();

        // Set document title or other text
        doc.text(`Attendance Details - ${formatDate(selectedDate)}`, 14, 16);

        // Define table columns and headers
        const headers = ['Stage Name', 'Shift ID', 'Line', 'Allot', 'Present', 'Absent'];

        // Add autoTable to the document
        doc.autoTable({
            head: [headers],
            body: [...data, totalRow], // Append totals row to data
            startY: 30, // Adjust starting Y position to avoid overlap with title
            styles: {
                fontSize: 10, // Font size for table
                cellPadding: 3, // Cell padding
            },
        });

        // Save the PDF
        doc.save(`Attendance_Details_${formatDate(selectedDate)}.pdf`);
    };

    const downloadAll = () => {
        // Map the attendance details to an array of arrays for PDF
        const data = detailedRecords.map(record => [
            record.USERID,
            record.NAME,
            record.Stage_name,
            record.SHIFT_ID,
            (detailType === 'showAll' || detailType === 'absent') ? record.LINE : null,
            (detailType === 'showAll') ? record.STATUS : null,
        ].filter(value => value !== null)); // Remove null values

        // Create a new jsPDF instance
        const doc = new jsPDF();

        // Set document title or other text
        const detailTypeTitle = detailType === 'showAll'
            ? 'All Details'
            : detailType === 'absent'
                ? 'Absent Details'
                : 'Details';
        doc.text(`Attendance - ${detailTypeTitle} - ${formatDate(selectedDate)}`, 14, 16);

        // Define table columns and headers based on detailType
        const headers = ['User ID', 'User Name', 'Stage Name', 'Shift ID'];
        if (detailType === 'showAll' || detailType === 'absent') {
            headers.push('Line');
        }
        if (detailType === 'showAll') {
            headers.push('Status');
        }

        // Add autoTable to the document
        doc.autoTable({
            head: [headers],
            body: data,
            startY: 30, // Adjust starting Y position to avoid overlap with title
            styles: {
                fontSize: 10, // Font size for table
                cellPadding: 3, // Cell padding
            },
        });

        // Save the PDF
        doc.save(`Attendance_${detailTypeTitle}_${formatDate(selectedDate)}.pdf`);
    };

    const handleSaveAllSwaps = () => {
        const recordsToSwap = detailedRecords.filter(record => record.swapEmployee);

        if (recordsToSwap.length === 0) {
            alert("No records selected for swapping.");
            return;
        }

        const swaps = recordsToSwap.map(record => ({
            shiftDate: formatDate(selectedDate),
            Stage_name: record.Stage_name,
            shiftId: record.SHIFT_ID,
            line: record.LINE,
            absentUserId: record.USERID,
            swapUserId: record.swapEmployee.split(' ')[0],
        }));

        console.log(swaps);

        axios.post('http://localhost:5000/api/saveUserSwap', swaps)
            .then(response => {
                alert('Swaps saved successfully');
                // Refresh records or handle UI update
                fetchAttendanceDetails();
                setDetailedRecords(prevRecords =>
                    prevRecords.map(record => ({
                        ...record,
                        swapEmployee: '',
                    }))
                );
            })
            .catch(error => console.error(error));
    };

    useEffect(() => {
        const formattedDate = formatDate(selectedDate);
        if (swapPopup && selectedRecord) {
            console.log('Stage_name :', selectedRecord.Stage_name)
            // Replace with your API endpoint
            axios.get('http://localhost:5000/api/getEmployees', {
                params: {
                    date: formattedDate,
                    shiftId: selectedRecord.SHIFT_ID,
                    Stage_name: selectedRecord.Stage_name,  // Pass shiftId from the selected record
                }
            })
                .then(response => {
                    setSwapEmployees(response.data);
                })
                .catch(error => {
                    console.error('Error fetching the employee list:', error);
                });
        }
    }, [swapPopup]);

    const handleShowEmployees = (USERID, NAME, SHIFT_ID, Stage_name, LINE) => {

        setSelectedRecord({ USERID, NAME, SHIFT_ID, Stage_name, LINE });  // Store the selected record
        setSwapPopup(true);  // Show the popup
    };

    const handleClosePopup = () => {
        // setSelectedRecord(null);  // Reset selected record
        setSwapPopup(false);  // Hide the popup
    };

    // const handleInputChange = (event) => {
    //     setSelectedEmployee(event.target.value);
    // };

    function handleEmployeeSelect(swapdetail) {
        if (swapdetail && swapdetail.USERID) {
            setSelectedEmployee(swapdetail.USERID);  // Use the correct state update logic
        } else {
            console.error("Invalid employee details:", swapdetail);
        }
    }
    // const filteredEmployees = swapEmployees.filter((swapdetail) => {
    //     const query = searchQuery.toLowerCase();
    //     return (
    //         swapdetail.USERID.toLowerCase().includes(query) ||
    //         swapdetail.NAME.toLowerCase().includes(query) ||
    //         swapdetail.Stage_name.toLowerCase().includes(query) ||
    //         swapdetail.SKILL_DESCRIPTION.toLowerCase().includes(query)
    //     );
    // });
    const filteredEmployees = swapEmployees.filter((swapdetail) => {
        const query = searchQuery.toLowerCase();
        return (
            (swapdetail.USERID && swapdetail.USERID.toLowerCase().includes(query)) ||
            (swapdetail.NAME && swapdetail.NAME.toLowerCase().includes(query)) ||
            (swapdetail.Stage_name && swapdetail.Stage_name.toLowerCase().includes(query)) ||
            (swapdetail.SKILL_DESCRIPTION && swapdetail.SKILL_DESCRIPTION.toLowerCase().includes(query))
        );
    });


    const handlesubmit = () => {
        if (selectedEmployee) {
            // Update the record with the selected employee
            const updatedRecord = { ...selectedRecord, swapEmployee: selectedEmployee };

            // Update the detailedRecords with the modified record
            const updatedRecords = detailedRecords.map(record =>
                record.USERID === selectedRecord.USERID && record.SHIFT_ID === selectedRecord.SHIFT_ID
                    ? updatedRecord
                    : record
            );

            setDetailedRecords(updatedRecords); // Update state with modified records
            setSelectedEmployee(''); // Reset the selected employee input
            setSwapPopup(false); // Hide the popup
        } else {
            alert("Please select an employee before submitting.");
        }
    };

    return (
        <>
            <Container fluid>
                <style>
                    {`
    .animated-button {
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        padding: 10px 20px;
        cursor: pointer;
        transition: transform 0.2s, background-color 0.2s;
        font-size: 1rem;
    }

    .animated-button:hover {
        transform: scale(1.05);
        background-color: #0056b3;
    }

    .animated-button:active {
        transform: scale(0.95);
    }

    .present {
        background-color: #28a745;
    }

    .absent {
        background-color: #dc3545;
    }

    .scrollable-table {
        max-height: 400px;
        overflow-y: auto;
    }

    .button-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: space-between;
    }

    .button-fit {
        flex: 1 1 auto;
        white-space: nowrap;
        margin-bottom: 10px;
        text-align: center;
        padding: 10px 20px;
        border-radius: 5px;
        background-color: #6c757d;
        color: white;
        border: none;
        transition: background-color 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .button-fit:hover {
        background-color: #5a6268;
    }

    .button-fit:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(108, 117, 125, 0.5);
    }

    .graph-container {
        height: 300px;
    }

    .search-input {
        width: 100%;
        padding: 8px;
        margin-bottom: 10px;
        border-radius: 4px;
        border: 1px solid #ddd;
    }

    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .popup-content {
        background-color: #fff;
        padding: 40px;
        border-radius: 8px;
        width: 60%;
        height: 80%;
        box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.3);
        text-align: center;
        overflow-y: auto;
    }

    .popup-content input[type="text"] {
        width: 100%;
        padding: 15px;
        margin-bottom: 30px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 18px;
    }

    .popup-content button {
        padding: 10px 20px;
        margin: 15px;
        border: none;
        border-radius: 4px;
        background-color: #007bff;
        color: white;
        cursor: pointer;
        font-size: 18px;
    }

    .popup-content button.close-button {
        background-color: #dc3545;
    }

    .popup-content button:hover {
        background-color: #0056b3;
    }

    .popup-content button.close-button:hover {
        background-color: #c82333;
    }

    /* Media Queries for Responsive Design */
    @media (max-width: 768px) {
        .animated-button {
            font-size: 0.875rem; /* Slightly smaller font size */
            padding: 8px 16px;
        }

        .button-fit {
            font-size: 14px;
            padding: 8px 16px;
        }

        .popup-content {
            width: 60%; /* Full width for smaller screens */
            height: 60%; /* Height adjusts automatically */
            padding: 20px; /* Reduce padding for small screens */
        }

        .popup-content input[type="text"] {
            font-size: 16px; /* Smaller font size */
        }

        .popup-content button {
            font-size: 16px; /* Smaller font size */
            padding: 8px 16px; /* Adjust padding */
        }

        .search-input {
            font-size: 14px; /* Smaller font size */
        }
    }

    @media (max-width: 480px) {
        .animated-button {
            font-size: 0.75rem; /* Smaller font size */
            padding: 6px 12px;
        }

        .button-fit {
            font-size: 12px;
            padding: 6px 12px;
        }

        .popup-content {
            width: 50%; /* Almost full width */
            height: 50%; /* Height adjusts automatically */
            padding: 15px; /* Further reduced padding */
        }

        .popup-content input[type="text"] {
            font-size: 14px; /* Smaller font size */
        }

        .popup-content button {
            font-size: 14px; /* Smaller font size */
            padding: 6px 12px; /* Adjust padding */
        }

        .search-input {
            font-size: 12px; /* Smaller font size */
        }
    }
    `}
                </style>

                {swapPopup && (
                    <div className="popup-overlay">
                        <div className="popup-content">
                            <input
                                type="text"
                                placeholder="Search by User ID, Name, Stage Name , or Skill"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Select</th>
                                        <th>User ID</th>
                                        <th>Name</th>
                                        <th>Stage Name</th>
                                        <th>Skill</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((swapdetail, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    value={swapdetail.USERID}
                                                    checked={selectedEmployee === swapdetail.USERID}
                                                    onChange={() => handleEmployeeSelect(swapdetail)}
                                                />
                                            </td>
                                            <td>{swapdetail.USERID}</td>
                                            <td>{swapdetail.NAME}</td>
                                            <td>{swapdetail.Stage_name}</td>
                                            <td>{swapdetail.SKILL_DESCRIPTION}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <button className="submit-button" onClick={handlesubmit}>
                                Submit
                            </button>
                            <button className="close-button" onClick={handleClosePopup}>
                                Close
                            </button>
                        </div>
                    </div>

                )}
                <Row className="mt-4">
                    <h1>Attendance Management</h1>
                    <div className="d-flex justify-content-end mb-3">
                        <Form.Control
                            type="date"
                            value={formatDate(selectedDate)}
                            onChange={handleDateChange}
                            style={{ width: 'auto', marginRight: '10px', fontSize: '15px' }}
                        />
                    </div>

                    <Row>
                        <Col md={6} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">

                                <h3>Select Shifts</h3> </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ced4da', padding: '10px', fontSize: '15px' }}>

                                {loadingShifts ? (
                                    <Spinner animation="border" variant="primary" />
                                ) : (
                                    shiftOptions.map((shift, index) => (
                                        <Form.Check
                                            key={index}
                                            type="checkbox"
                                            label={shift.SHIFT_ID}
                                            value={shift.SHIFT_ID}
                                            onChange={(e) => handleCheckboxChange(e, setSelectedShifts, selectedShifts)}
                                        />
                                    ))
                                )}
                            </div>

                        </Col>

                        <Col md={6} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3>Select Lines</h3>

                                <Button onClick={handleButtonClick} style={{ fontSize: '14px' }}>
                                    Show Records
                                </Button>
                            </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ced4da', padding: '10px', fontSize: '15px' }}>

                                {loadingLines ? (
                                    <Spinner animation="border" variant="primary" />
                                ) : (
                                    lineOptions.map((line, index) => (
                                        <div key={index} style={{ marginBottom: '8px' }}>
                                            <input
                                                type="checkbox"
                                                value={line.LINE.trim()}
                                                onChange={handleLineChange}
                                                style={{ marginRight: '5px' }}
                                            />
                                            <label>{line.LINE.trim()}</label>
                                        </div>
                                    ))
                                )} </div>
                        </Col>
                    </Row>
                    {showTable && (
                        <Row>
                            <Col md={6} className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h2>Attendance Details</h2>
                                    <Button onClick={handleShowAll} style={{ marginLeft: '10px', fontSize: '14px' }}>
                                        Show All
                                    </Button> &nbsp;
                                    <Button variant="success" onClick={downloadPdf}><FaDownload /> Attendance Details</Button>

                                </div>
                                <div className="scrollable-table">
                                    {loadingDetails ? (
                                        <Spinner animation="border" />
                                    ) : (
                                        <Table striped bordered hover responsive>
                                            <thead style={{ fontSize: '15px' }}>
                                                <tr>
                                                    <th>S.No</th> {/* Serial Number Column */}
                                                    <th>Stage Name</th>
                                                    <th>Shift ID</th>
                                                    <th>Line</th>
                                                    <th>Allot</th>
                                                    <th>Present</th>
                                                    <th>Absent</th>
                                                </tr>
                                            </thead>
                                            <tbody style={{ fontSize: '15px' }}>
                                                {attendanceDetails.map((detail, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td> {/* Display Serial Number */}
                                                        <td>{detail.Stage_name}</td>
                                                        <td>{detail.SHIFT_ID}</td>
                                                        <td>{detail.LINE}</td>
                                                        <td>
                                                            <button className="animated-button"
                                                                onClick={() => fetchDetailedRecords('allot', detail.SHIFT_ID, detail.Stage_name, detail.LINE)}>
                                                                {detail.ALLOT}
                                                            </button>
                                                            {loadingRecords && detailType === 'allot' && <Spinner animation="border" size="sm" />}
                                                        </td>
                                                        <td>
                                                            <button className={`animated-button present`}
                                                                onClick={() => fetchDetailedRecords('present', detail.SHIFT_ID, detail.Stage_name, detail.LINE)}>
                                                                {detail.PRESENT}
                                                            </button>
                                                            {loadingRecords && detailType === 'present' && <Spinner animation="border" size="sm" />}
                                                        </td>
                                                        <td>
                                                            <button className={`animated-button absent`}
                                                                onClick={() => fetchDetailedRecords('absent', detail.SHIFT_ID, detail.Stage_name, detail.LINE)}>
                                                                {detail.ABSENT}
                                                            </button>
                                                            {loadingRecords && detailType === 'absent' && <Spinner animation="border" size="sm" />}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan="2" style={{ fontWeight: 'bold' }}> Total </td>
                                                    <td></td>
                                                    <td style={{ fontWeight: 'bold' }}>{calculateTotals().allot}</td>
                                                    <td style={{ fontWeight: 'bold' }}>{calculateTotals().present}</td>
                                                    <td style={{ fontWeight: 'bold' }}>{calculateTotals().absent}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                            </Col>
                            {(showAllDetails || detailType) && (
                                <Col md={6} className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h2>
                                            {detailType === 'showAll'
                                                ? 'Show All Details'
                                                : detailType
                                                    ? `${detailType.charAt(0).toUpperCase() + detailType.slice(1)} Details`
                                                    : 'Details'}
                                        </h2>
                                        <Button variant="success" onClick={downloadAll}><FaDownload /> Download All Details</Button>
                                    </div>
                                    {detailType === 'absent' && (
                                        <div className="d-flex justify-content-end align-items-center mb-3">
                                            <Button onClick={handleSaveAllSwaps}>Save All Swaps</Button>
                                        </div>
                                    )}
                                    <div className="scrollable-table">
                                        {loadingRecords ? (
                                            <Spinner animation="border" />
                                        ) : (
                                            <Table striped bordered hover responsive>
                                                <thead style={{ fontSize: '15px' }}>
                                                    <tr>
                                                        <th>S.No</th> {/* Serial Number Column */}
                                                        <th>User ID</th>
                                                        <th>Name</th>
                                                        <th>Stage Name</th>
                                                        <th>Shift ID</th>
                                                        {detailType === 'showAll' && <th>Line</th>}
                                                        {detailType === 'showAll' && <th>Status</th>}
                                                        {detailType === 'absent' && <th>Line</th>}
                                                        {detailType === 'absent' && <th>Swap Emp</th>}
                                                        {detailType === 'absent' && <th>Selected Swap Employee</th>}
                                                        {detailType === 'absent' && <th>Swapped Employee</th>}
                                                    </tr>
                                                </thead>
                                                <tbody style={{ fontSize: '15px' }}>
                                                    {detailedRecords.map((record, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td> {/* Display Serial Number */}
                                                            <td>{record.USERID}</td>
                                                            <td>{record.NAME}</td>
                                                            <td>{record.Stage_name}</td>
                                                            <td>{record.SHIFT_ID}</td>
                                                            {detailType === 'showAll' && <td>{record.LINE}</td>}
                                                            {detailType === 'showAll' && (
                                                                <td style={{ color: record.STATUS === 'Absent' ? 'red' : 'green', fontWeight: 'bold' }}>
                                                                    {record.STATUS}
                                                                    {console.log('Status : ', record.STATUS)}
                                                                </td>
                                                            )}
                                                            {detailType === 'absent' && <td>{record.LINE}</td>}
                                                            {detailType === 'absent' && (
                                                                <td>
                                                                    <Button
                                                                        onClick={() => handleShowEmployees(record.USERID, record.NAME, record.SHIFT_ID, record.Stage_name, record.LINE)}
                                                                        disabled={record.SWAPUSERNAME} // Disable button if SWAPUSERNAME is not empty
                                                                    >
                                                                        Swap
                                                                    </Button>
                                                                </td>
                                                            )}
                                                            {detailType === 'absent' && (
                                                                <td>{record.swapEmployee || 'No Swap Selected'}</td>
                                                            )}
                                                            {detailType === 'absent' && (
                                                                <td>{record.SWAPUSERNAME}</td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>

                                        )}
                                    </div>
                                </Col>
                            )}         </Row>
                    )}

                    <Row>
                        {showGraph && (
                            <div style={{ marginTop: '20px' }}>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={[totals]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="allot" fill="#8884d8">
                                            <LabelList dataKey="allot" position="top" />
                                        </Bar>
                                        <Bar dataKey="present" fill="#82ca9d">
                                            <LabelList dataKey="present" position="top" />
                                        </Bar>
                                        <Bar dataKey="absent" fill="#ff7300">
                                            <LabelList dataKey="absent" position="top" />
                                        </Bar>
                                    </BarChart>

                                </ResponsiveContainer>
                            </div>
                        )}
                        {/* {showGraph && (
                            <div style={{ marginTop: '20px' }}>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={[totals]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="allot" fill="#8884d8"/>
                                        <Bar dataKey="present" fill="#82ca9d" />
                                        <Bar dataKey="absent" fill="#ff7300" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )} */}
                    </Row>

                </Row>
            </Container>
        </>
    );

};

export default Attendance;
