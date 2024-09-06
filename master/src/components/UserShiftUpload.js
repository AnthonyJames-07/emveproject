import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useTable } from 'react-table';
import axios from 'axios';
import { DateTime } from 'luxon';
import { FaFileDownload, FaEye, FaEyeSlash, FaSave } from 'react-icons/fa';
import { Container } from 'react-bootstrap';


const UserShiftUpload = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [notification, setNotification] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const columns = jsonData[0].map((col, index) => ({ Header: col, accessor: `col${index}` }));
      const rows = jsonData.slice(1).map((row, rowIndex) =>
        row.reduce((acc, cell, colIndex) => {
          acc[`col${colIndex}`] = cell;
          return acc;
        }, { id: rowIndex })
      );

      setColumns(columns);
      setData(rows);
      setNotification('File uploaded successfully');
      setShowTable(false);
    };

    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const parseDate = (dateStr) => {
    const isDDMMYYYY = DateTime.fromFormat(dateStr, 'dd-MM-yyyy').isValid;
    if (isDDMMYYYY) {
      return DateTime.fromFormat(dateStr, 'dd-MM-yyyy').toFormat('yyyy-MM-dd');
    }

    const isYYYYMMDD = DateTime.fromFormat(dateStr, 'yyyy-MM-dd').isValid;
    if (isYYYYMMDD) {
      return dateStr;
    }

    return dateStr;
  };

  const handleUserShifts = async () => {
    const batchSize = 100;
    const totalRecords = data.length;

    for (let i = 0; i < totalRecords; i += batchSize) {
      const shiftsBatch = [];

      for (let j = i; j < Math.min(i + batchSize, totalRecords); j++) {
        for (let k = 4; k <= 10; k++) {
          const date = parseDate(columns[k].Header);

          shiftsBatch.push({
            "Shift_date_from": date,
            "Shift_date_to": date,
            "userid": data[j].col0,
            "STAGE_NAME": data[j].col2,
            "SHIFT_ID": data[j]['col' + k],
            "LINE" : data[j].col3
          });
        }
      }

      const jsonstring = JSON.stringify(shiftsBatch);

      console.log(jsonstring);

      try {
        const response = await axios.post('http://localhost:5000/api/saveUserShifts', jsonstring, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log(response.data);
        setMessage('Saved successfully');
      } catch (error) {
        console.error('Error saving shifts:', error);
        setMessage('Error saving shifts. Please try again.');
      }
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = 'http://localhost:5000/download-template';
    link.download = 'sample_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tableInstance = useTable({ columns, data });

  return (
    <Container fluid>
      <style>
        {`
          .title {
            text-align: center;
            margin-bottom: 20px;
          }

          .file-upload {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 20px;
          }

          .input-file {
            flex: 1;
          }

          .button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background-color 0.3s ease;
            margin-left: 10px;
          }

          .button:hover {
            background-color: #45a049;
          }

          .icon {
            margin-right: 5px;
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

          .message {
            margin-top: 10px;
            color: red;
            text-align: center;
          }

          .data-table {
            border-collapse: collapse;
            width: 100%;
          }

          .data-table th, .data-table td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
          }

          .data-table th {
            background-color: #f2f2f2;
          }

          @media (max-width: 768px) {
            .container {
              padding: 10px;
            }

            .button {
              padding: 8px 15px;
              font-size: 14px;
            }

            .file-upload {
              flex-direction: column;
            }

            .input-file {
              margin-bottom: 10px;
            }

            .data-table th, .data-table td {
              padding: 5px;
            }
          }
        `}
      </style>
      <h2 className="title">User Shift Upload</h2>
      <div className="file-upload">
        <input className="input-file" type="file" accept=".xlsx" onChange={handleFileUpload} style={{fontSize:'15px'}} />
      </div>
      {notification && (
        <div className="notification">{notification}</div>
      )}
      {data.length > 0 && (
        <div className="d-flex justify-content-between mb-3">
          <button className="button" onClick={() => setShowTable(!showTable)} style={{fontSize:'14px'}}>
            {showTable ? <><FaEyeSlash className="icon" /> Hide Data</> : <><FaEye className="icon" /> View Data</>}
          </button>
          <button className="button" onClick={handleUserShifts} style={{fontSize:'14px'}}>
            <FaSave className="icon" /> Save
          </button>
        </div>
      )}
      <div className="d-flex justify-content-first mb-3">
        <button className="button" onClick={downloadTemplate} style={{fontSize:'14px'}}>
          <FaFileDownload className="icon" /> Download Sample Template
        </button>
      </div>
      {message && <div className="message">{message}</div>}
      {showTable && data.length > 0 && (
        <table className="data-table" {...tableInstance.getTableProps()}>
          <thead style={{fontSize:'15px'}}>
            {tableInstance.headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map((column) => (
                  <th {...column.getHeaderProps()} key={column.id}>
                    {column.render('Header')}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...tableInstance.getTableBodyProps()} style={{fontSize:'15px'}}>
            {tableInstance.rows.map((row) => {
              tableInstance.prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={row.id}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()} key={cell.column.id}>
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Container>
  );
};

export default UserShiftUpload;
