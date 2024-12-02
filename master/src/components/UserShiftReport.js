import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Form, Container, Row, Col, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { FaSort, FaDownload } from 'react-icons/fa';
import moment from 'moment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/UserShiftReport.css';  // Import the CSS file

const baseURL = 'http://localhost:5000/api';

const UserShiftReport = () => {
    const [userShifts, setUserShifts] = useState([]);
    const [searchUserShift, setSearchUserShift] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDate] = useState('');
    const [selectedShiftIds, setSelectedShiftIds] = useState([]);
    const [selectedStages, setSelectedStages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState('');
    const [selectedFromDate, setSelectedFromDate] = useState(moment().format('YYYY-MM-DD'));
    const [selectedToDate, setSelectedToDate] = useState(moment().format('YYYY-MM-DD'));
    const [filteredUserShifts, setFilteredUserShifts] = useState([]);
    const pageSize = 100;

    const fetchUserShifts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${baseURL}/getUserShifts`, {
                params: { date: selectedDate }
            });
            setUserShifts(response.data);
        } catch (error) {
            console.error('Error fetching user shifts:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchUserShifts();
    }, [fetchUserShifts]);

    const handleSearchUser = (e) => {
        setSearchUserShift(e.target.value);
        setCurrentPage(1); // Reset to the first page when search input changes
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedData = (data) => {
        if (!sortConfig.key) {
            return data;
        }
        return data.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const handleFromDateChange = (e) => {
        setSelectedFromDate(e.target.value);
        setCurrentPage(1); // Reset to first page on date change
    };

    const handleToDateChange = (e) => {
        setSelectedToDate(e.target.value);
        setCurrentPage(1); // Reset to first page on date change
    };

    const getFilteredData = () => {
        return userShifts.filter((shift) => {
            const shiftDate = moment(shift.Shift_date_from, 'YYYY-MM-DD');
            const fromDate = moment(selectedFromDate, 'YYYY-MM-DD');
            const toDate = moment(selectedToDate, 'YYYY-MM-DD');

            const withinDateRange = (!selectedFromDate || shiftDate.isSameOrAfter(fromDate, 'day')) &&
                (!selectedToDate || shiftDate.isSameOrBefore(toDate, 'day'));

            return (
                withinDateRange &&
                (!selectedShiftIds.length || selectedShiftIds.includes(shift.SHIFT_ID)) &&
                (!selectedStages.length || selectedStages.includes(shift.Stage_name))
            );
        });
    };

    const handleShowData = () => {
        const results = getFilteredData();
        setFilteredUserShifts(results);
        if (results.length === 0) {
            setNotification('No records found');
        } else {
            setNotification('');
        }
    };

    const sortedUserShifts = getSortedData(filteredUserShifts);
    const paginatedUserShifts = sortedUserShifts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key === columnKey) {
            return <FaSort className={sortConfig.direction === 'asc' ? 'rotate-up' : 'rotate-down'} />;
        }
        return <FaSort />;
    };

    const handleNextPage = () => {
        if (currentPage * pageSize < sortedUserShifts.length) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const formatDate = (date) => {
        return moment(date).format('DD-MM-YYYY');
    };

    const handleShiftIdChange = (e) => {
        const value = e.target.value;
        setSelectedShiftIds(prev =>
            e.target.checked ? [...prev, value] : prev.filter(id => id !== value)
        );
    };

    const handleStageChange = (e) => {
        const value = e.target.value;
        setSelectedStages(prev =>
            e.target.checked ? [...prev, value] : prev.filter(stage => stage !== value)
        );
    };

    const handleDownload = () => {
        const formattedData = filteredUserShifts.map(shift => ({
            'User ID': shift.userid || '',
            'User Name': shift.user_name || '',
            'SHIFT ID': shift.SHIFT_ID || '',
            'Stage Name': shift.Stage_name || '',
            'Shift Date From': formatDate(shift.Shift_date_from) || '',
            'Shift Date To': formatDate(shift.Shift_date_to) || '',
            'Line': shift.LINE || '' // Add the LINE column here
        }));

        const doc = new jsPDF();
        doc.autoTable({
            head: [['User ID', 'User Name', 'SHIFT ID', 'Stage Name', 'Shift Date From', 'Shift Date To', 'Line']],
            body: formattedData.map(row => [
                row['User ID'],
                row['User Name'],
                row['SHIFT ID'],
                row['Stage Name'],
                row['Shift Date From'],
                row['Shift Date To'],
                row['Line']
            ]),
        });

        doc.save('UserShifts.pdf');
    };

    const uniqueShiftIds = [...new Set(userShifts.map(shift => shift.SHIFT_ID))];
    const uniqueStages = [...new Set(userShifts.map(shift => shift.Stage_name))];

    const highlightText = (text, highlight) => {
        if (!highlight.trim()) {
            return text;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        return text.split(regex).map((part, index) =>
            part.toLowerCase() === highlight.toLowerCase() ? (
                <span key={index} className="highlight">{part}</span>
            ) : (
                part
            )
        );
    };

    return (
        <Container fluid>
            <Row className="mt-4">
                <Col md={12}>
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                        <h2 className="mb-4">User Shift Details</h2>
                        <div className="d-flex flex-wrap">
                            <Form.Group className="mb-3 mr-2 custom-search">
                                <Form.Control
                                    type="text"
                                    placeholder="Search for User Shift details"
                                    value={searchUserShift}
                                    onChange={handleSearchUser}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3 mr-2 custom-date">
                                <Form.Control
                                    type="date"
                                    value={selectedFromDate}
                                    onChange={handleFromDateChange}
                                    placeholder="From Date"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3 mr-2 custom-date">
                                <Form.Control
                                    type="date"
                                    value={selectedToDate}
                                    onChange={handleToDateChange}
                                    placeholder="To Date"
                                />
                            </Form.Group>
                            <Button variant="primary" onClick={handleShowData} className="custom-btn">Show</Button>
                        </div>
                    </div>
                    {notification && <Alert variant="warning">{notification}</Alert>}

                    <Row>
                        <Col md={6} className="mb-3">
                            <h5>Filter by SHIFT ID</h5>
                            <div className="filter-container">
                                {loading ? <Spinner animation="border" /> :
                                    uniqueShiftIds.map(id => (
                                        <Form.Check
                                            key={id}
                                            type="checkbox"
                                            label={id}
                                            value={id}
                                            checked={selectedShiftIds.includes(id)}
                                            onChange={handleShiftIdChange}
                                            className="filter-check"
                                        />
                                    ))
                                }
                            </div>
                        </Col>
                        <Col md={6} className="mb-3">
                            <h5>Filter by Stage Name</h5>
                            <div className="filter-container">
                                {loading ? <Spinner animation="border" /> :
                                    uniqueStages.map(stage => (
                                        <Form.Check
                                            key={stage}
                                            type="checkbox"
                                            label={stage}
                                            value={stage}
                                            checked={selectedStages.includes(stage)}
                                            onChange={handleStageChange}
                                            className="filter-check"
                                        />
                                    ))
                                }
                            </div>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end mb-3">
                    <Button onClick={handleDownload} className="ml-3"><FaDownload /> Download PDF</Button>
                    </div>

                    {loading ? (
                        <Spinner animation="border" />
                    ) : (
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('userid')} className="sortable">
                                        User ID <SortIcon columnKey="userid" />
                                    </th>
                                    <th onClick={() => handleSort('user_name')} className="sortable">
                                        User Name <SortIcon columnKey="user_name" />
                                    </th>
                                    <th onClick={() => handleSort('SHIFT_ID')} className="sortable">
                                        SHIFT ID <SortIcon columnKey="SHIFT_ID" />
                                    </th>
                                    <th onClick={() => handleSort('Stage_name')} className="sortable">
                                        Stage Name <SortIcon columnKey="Stage_name" />
                                    </th>
                                    <th onClick={() => handleSort('Shift_date_from')} className="sortable">
                                        Shift Date From <SortIcon columnKey="Shift_date_from" />
                                    </th>
                                    <th onClick={() => handleSort('Shift_date_to')} className="sortable">
                                        Shift Date To <SortIcon columnKey="Shift_date_to" />
                                    </th>
                                    <th>Line</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUserShifts.map((shift, index) => (
                                    <tr key={index}>
                                        <td>{highlightText(shift.userid, searchUserShift)}</td>
                                        <td>{highlightText(shift.user_name, searchUserShift)}</td>
                                        <td>{highlightText(shift.SHIFT_ID, searchUserShift)}</td>
                                        <td>{highlightText(shift.Stage_name, searchUserShift)}</td>
                                        <td>{highlightText(formatDate(shift.Shift_date_from), searchUserShift)}</td>
                                        <td>{highlightText(formatDate(shift.Shift_date_to), searchUserShift)}</td>
                                        <td>{highlightText(shift.LINE, searchUserShift)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}

                    <div className="pagination-controls">
                        <Button onClick={handlePrevPage} disabled={currentPage === 1}>Prev</Button>
                        <span>Page {currentPage} of {Math.ceil(sortedUserShifts.length / pageSize)}</span>
                        <Button onClick={handleNextPage} disabled={currentPage * pageSize >= sortedUserShifts.length}>Next</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default UserShiftReport;
