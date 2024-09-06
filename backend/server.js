require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const app = express();

const path = require('path');

const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: true, // Set to true if needed
  },
};

app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

// Login route
app.post('/api/login', async (req, res) => {
  const { userId, password } = req.body;

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('userId', sql.VarChar, userId)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM Mx_UserLogin WHERE user_id = @userId AND password = @password');

    if (result.recordset.length > 0) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid user ID or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/stage-master', async (req, res) => {
  const { Stage_name, Stage_Type } = req.body;

  if (!Stage_name || !Stage_Type) {
    return res.status(400).send('Stage_name and Stage_Type are required');
  }

  try {
    const pool = await sql.connect(config);

    // Check if the stage name already exists
    const checkStageQuery = 'SELECT TOP 1 Stage_id FROM Mx_StageMaster WHERE Stage_name = @Stage_name';
    const checkStageRequest = pool.request();
    checkStageRequest.input('Stage_name', sql.NVarChar, Stage_name);
    const existingStage = await checkStageRequest.query(checkStageQuery);

    if (existingStage.recordset.length > 0) {
      return res.status(409).send('Stage Name already exists');
    }

    // Insert the new stage
    const insertQuery = `
      INSERT INTO Mx_StageMaster (Stage_name, Stage_Type) 
      OUTPUT INSERTED.Stage_id, INSERTED.Stage_name, INSERTED.Stage_Type 
      VALUES (@Stage_name, @Stage_Type);
    `;
    const request = pool.request();
    request.input('Stage_name', sql.NVarChar, Stage_name);
    request.input('Stage_Type', sql.NVarChar, Stage_Type);
    const result = await request.query(insertQuery);

    res.status(201).json({
      Stage_id: result.recordset[0].Stage_id,
      Stage_name: result.recordset[0].Stage_name,
      Stage_Type: result.recordset[0].Stage_Type,
      message: 'Stage inserted successfully'
    });
  } catch (err) {
    console.error('Error adding stage:', err);
    res.status(500).send('Error adding stage');
  }
});

app.get('/api/stage-master', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT Stage_id, Stage_name, Stage_Type FROM Mx_StageMaster');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching stages:', err);
    res.status(500).send('Error fetching stages');
  }
});

app.put('/api/stage-master/:id', async (req, res) => {
  const { id } = req.params;
  const { Stage_name, Stage_Type } = req.body;

  if (!Stage_name || !Stage_Type) {
    return res.status(400).send('Stage_name and Stage_Type are required');
  }

  try {
    const pool = await sql.connect(config);

    // Check if the stage exists
    const checkStageQuery = 'SELECT Stage_id FROM Mx_StageMaster WHERE Stage_id = @Stage_id';
    const checkStageRequest = pool.request();
    checkStageRequest.input('Stage_id', sql.Int, id);
    const existingStage = await checkStageRequest.query(checkStageQuery);

    if (existingStage.recordset.length === 0) {
      return res.status(404).send('Stage not found');
    }

    // Update the stage
    const updateQuery = `
      UPDATE Mx_StageMaster 
      SET Stage_name = @Stage_name, Stage_Type = @Stage_Type 
      WHERE Stage_id = @Stage_id
    `;
    const request = pool.request();
    request.input('Stage_id', sql.Int, id);
    request.input('Stage_name', sql.NVarChar, Stage_name);
    request.input('Stage_Type', sql.NVarChar, Stage_Type);

    const result = await request.query(updateQuery);

    res.status(200).json({
      Stage_id: id,
      Stage_name: Stage_name,
      Stage_Type: Stage_Type,
      message: 'Stage updated successfully'
    });
  } catch (err) {
    console.error('Error updating stage:', err);
    res.status(500).send('Error updating stage');
  }
});


// Skill Master - Insert a new skill
app.post('/api/skill-master', async (req, res) => {
  const { Skill_Rating, Skill_Description } = req.body;

  if (!Skill_Rating || !Skill_Description) {
    return res.status(400).send('Skill_Rating and Skill_Description are required');
  }

  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('Skill_Rating', sql.Char, Skill_Rating);
    request.input('Skill_Description', sql.NVarChar, Skill_Description);

    // Check for duplicates
    const duplicateCheck = await request.query(`
      SELECT COUNT(*) AS count
      FROM Mx_SkillMaster
      WHERE Skill_Description = @Skill_Description
    `);

    if (duplicateCheck.recordset[0].count > 0) {
      return res.status(400).send('Skill_Description must be unique.');
    }

    // Insert the new skill
    const result = await request.query(`INSERT INTO Mx_SkillMaster (Skill_Rating, Skill_Description) VALUES (@Skill_Rating, @Skill_Description); SELECT SCOPE_IDENTITY() AS Skill_id;`);
    res.status(201).json({
      Skill_id: result.recordset[0].Skill_id,
      Skill_Rating: Skill_Rating,
      Skill_Description: Skill_Description,
      message: 'Skill inserted successfully'
    });
  } catch (error) {
    console.error('Error inserting skill:', error);
    res.status(500).send(error.message);
  }
});

// Update a skill
app.put('/api/skill-master/:id', async (req, res) => {
  const { id } = req.params;
  const { Skill_Rating, Skill_Description } = req.body;

  if (!Skill_Rating || !Skill_Description) {
    return res.status(400).send('Skill_Rating and Skill_Description are required');
  }

  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('Skill_id', sql.Int, id);
    request.input('Skill_Rating', sql.Char, Skill_Rating);
    request.input('Skill_Description', sql.NVarChar, Skill_Description);
    await request.query(`UPDATE Mx_SkillMaster SET Skill_Rating = @Skill_Rating, Skill_Description = @Skill_Description WHERE Skill_id = @Skill_id;`);
    res.status(200).json({ Skill_id: id, Skill_Rating: Skill_Rating, Skill_Description: Skill_Description, message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).send(error.message);
  }
});

// Fetch a skill by ID
app.get('/api/skill-master/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(config);
    const request = pool.request();
    request.input('Skill_id', sql.Int, id);
    const result = await request.query(`SELECT Skill_id, Skill_Rating, Skill_Description FROM Mx_SkillMaster WHERE Skill_id = @Skill_id;`);
    if (result.recordset.length === 0) {
      res.status(404).send('Skill not found');
    } else {
      res.json(result.recordset[0]);
    }
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).send(error.message);
  }
});

// Fetch all skills
app.get('/api/skill-master', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT Skill_id, Skill_Rating, Skill_Description FROM Mx_SkillMaster');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).send(error.message);
  }
});

// Fetch all departments
app.get('/api/departments', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT dptid, NAME AS DeptName FROM Mx_DepartmentMst');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).send(error.message);
  }
});

// Fetch employees by selected departments
app.post('/api/employees', async (req, res) => {
  const { departments } = req.body;
  if (!departments || departments.length === 0) {
    return res.status(400).send('No departments selected');
  }

  try {
    const pool = await sql.connect(config);

    const query = `
      SELECT u.userid, u.name + '-' + u.userid AS name, u.Enrolldt, d.Name AS designation
      FROM Mx_UserMst u
      JOIN Mx_DesignationMst d ON u.Dsgid = d.Dsgid
      WHERE u.dptid IN (${departments.map((dept) => `'${dept}'`).join(',')})
      ORDER BY u.name + '-' + u.userid
    `;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).send(error.message);
  }
});

// Fetch all stages
app.get('/api/stagemaster', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT Stage_id, Stage_name FROM Mx_StageMaster');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching stages:', error);
    res.status(500).send(error.message);
  }
});

// Fetch all skills
app.get('/api/skillmaster', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT Skill_id, Skill_Rating, Skill_Description FROM Mx_SkillMaster');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).send(error.message);
  }
});

// Endpoint to save skills for multiple employees
app.post('/api/save-skills', async (req, res) => {
  const { data } = req.body;

  // Validate request data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return res.status(400).send('Invalid data format');
  }

  let transaction;

  try {
    // Connect to the database
    const pool = await sql.connect(config);

    // Begin a new transaction
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Iterate through each employee's skill data to be saved
    for (const employeeData of data) {
      const { employeeId, stages } = employeeData;
      if (!employeeId || !Array.isArray(stages)) {
        throw new Error('Invalid input data');
      }

      await pool.request().query(`DELETE FROM Mx_UserSkills WHERE USERID = ${employeeId}`);
      for (const stageData of stages) {
        const { stageId, rating } = stageData;
        if (!stageId || !rating) {
          throw new Error('Invalid stage data');
        }

        console.log(`Saving: EmployeeId: ${employeeId}, StageId: ${stageId}, Rating: ${rating}`);

        // Execute the SQL query within the transaction
        await transaction.request().query(`
                  INSERT INTO Mx_UserSkills (userid, Stage_id, Skill_id)
                  VALUES (${employeeId}, ${stageId}, ${rating})
              `);
      }
    }

    // Commit the transaction if all queries succeed
    await transaction.commit();
    res.send('Skills saved successfully');
  } catch (error) {
    console.error('Error saving skills:', error);

    // Rollback the transaction on error
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }

    // Respond with an internal server error
    res.status(500).send('Server error');
  }
});

// Fetch user skills
app.get('/api/user-skills', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query(`
          SELECT P2.NAME, P3.STAGE_NAME, P4.Skill_Description, P1.USERID
          FROM Mx_UserSkills AS P1
          LEFT OUTER JOIN Mx_UserMst AS P2 ON P1.USERID = P2.USERID
          LEFT OUTER JOIN MX_STAGEMASTER AS P3 ON P1.STAGE_ID = P3.STAGE_ID
          LEFT OUTER JOIN MX_SKILLMASTER AS P4 ON P1.SKILL_ID = P4.SKILL_ID order by P3.STAGE_NAME,P2.NAME
      `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching user skills:', error);
    res.status(500).send('Server error');
  }
});

// Delete user skill
app.delete('/api/user-skills/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    let pool = await sql.connect(config);
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Mx_UserSkills WHERE USERID = @userId');
    res.sendStatus(200);
  } catch (error) {
    console.error('Error deleting user skill:', error);
    res.status(500).send('Server error');
  }
});

//USER SHIFT 
// Endpoint to handle POST request for saving user shifts
app.post('/api/saveUserShifts', async (req, res) => {
  const shiftsData = req.body;

  try {
    // Connect to SQL Server
    await sql.connect(config);

    // Prepare SQL query to insert shifts data
    const request = new sql.Request();

    const batchSize = 100; // Number of records per batch

    for (let i = 0; i < shiftsData.length; i += batchSize) {
      let QUERY1 = "";

      // Get the current batch of shifts
      const batch = shiftsData.slice(i, i + batchSize);

      for (let shift of batch) {
        const { Shift_date_from, Shift_date_to, userid, STAGE_NAME, SHIFT_ID, LINE } = shift;

        if (QUERY1.length > 0) {
          QUERY1 += " UNION ALL ";
        }
        QUERY1 += `SELECT '${Shift_date_from}' AS SHIFT_FROM_DATE, '${Shift_date_to}' AS SHIFT_TO_DATE, '${userid}' AS userid, '${STAGE_NAME}' AS STAGE_NAME, '${SHIFT_ID}' AS SHIFT_ID, '${LINE}' AS LINE`;
      }

      const finalQuery = `
    INSERT INTO Mx_UserShifts (Shift_date_from, Shift_date_to, userid, stage_id,SHIFT_ID,LINE)
    SELECT SHIFT_FROM_DATE, SHIFT_TO_DATE, userid, P1.stage_id, SHIFT_ID,LINE
    FROM (${QUERY1}) AS Q1
    LEFT OUTER JOIN Mx_StageMaster AS P1 ON Q1.STAGE_NAME = P1.Stage_name
  `;

      try {
        await request.query(finalQuery);
        console.log(`Batch ${i / batchSize + 1} processed successfully.`);
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
      }
    }


    // Close SQL connection
    await sql.close();

    res.status(200).send('User shifts saved successfully.');
  } catch (err) {
    console.error('Error saving user shifts:', err);
    res.status(500).send('Error saving user shifts.');
  }
});


// Fetch user shifts with optional date filter
app.get('/api/getUserShifts', async (req, res) => {
  const { date } = req.query;
  try {
    let pool = await sql.connect(config);
    let query = `
          SELECT u.Shift_date_from, u.Shift_date_to, u.userid, u.SHIFT_ID, u.LINE, s.Stage_name, m.NAME AS user_name
          FROM Mx_UserShifts u
          LEFT JOIN MX_USERMST m ON u.userid = m.USERID
          LEFT JOIN Mx_StageMaster s ON u.stage_id = s.stage_id
      `;
    if (date) {
      query += ` WHERE u.Shift_date_from = '${date}' OR u.Shift_date_to = '${date}'`;
    }
    let result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching user shifts:', error);
    res.status(500).send('Server error');
  }
});


app.get('/api/attendance', async (req, res) => {
  const { date, shifts, lines } = req.query;

  try {
    await sql.connect(config);
    const result = await sql.query(`
SELECT DISTINCT Stage_name, Stageid AS STAGE_ID, SHIFT_ID, LINE1 AS LINE,
             SUM(ALLOT) AS ALLOT, SUM(PRESENT) AS PRESENT, SUM(ABSENT) AS ABSENT
      FROM (
          SELECT Q1.*,
                 CASE WHEN ISNULL(PUNCHDATE, '') = '' THEN 1 ELSE 0 END AS ABSENT,
                 CASE WHEN ISNULL(PUNCHDATE, '') <> '' THEN 1 ELSE 0 END AS PRESENT,
                 1 AS ALLOT,
				 CASE WHEN ISNULL(NSTAGE_ID,0)<>0 THEN NSTAGE_ID ELSE STAGE_ID END AS STAGEID,
				 CASE WHEN ISNULL(NLINE,'')<>'' THEN NLINE ELSE LINE END AS LINE1
          FROM (
        SELECT P1.USERID, P1.SHIFT_ID, P1.LINE, P3.SFTName, P1.STAGE_ID, P5.Name AS CGNAME, P2.NAME,
          (SELECT TOP 1 P5.Edatetime
           FROM Mx_ATDEventTrn AS P5
           WHERE P5.USERID = P1.USERID AND DATEADD(d, DATEDIFF(d, 0, P5.EDATETIME), 0) = P1.Shift_date_from
           ORDER BY P5.Edatetime) AS PUNCHDATE,
                     (SELECT TOP 1 P5.STAGE_ID 
                      FROM Mx_Userswap  AS P5
                      WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                      ORDER BY P5.SHIFT_DATE) AS NSTAGE_ID,
                     (SELECT TOP 1 P5.LINE
                      FROM Mx_Userswap  AS P5
                      WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                      ORDER BY P5.SHIFT_DATE) AS NLINE
              FROM Mx_UserShifts AS P1
              LEFT OUTER JOIN [Mx_ShiftMst] AS P3 ON P1.SHIFT_ID = P3.SFTID
              LEFT OUTER JOIN MX_USERMST AS P2 ON P1.USERID = P2.USERID
              LEFT OUTER JOIN Mx_CustomGroup1Mst AS P5 ON P2.CG1ID = P5.CG1ID
              WHERE Shift_date_from = '${date}'
                AND ISNULL(P2.UserIDEnbl, 0) = 1
                AND P1.SHIFT_ID IN (${shifts.split(',').map(shift => `'${shift}'`).join(',')})
                AND P1.LINE IN (${lines.split(',').map(line => `'${line.trim()}'`).join(',')})
          ) AS Q1 
      ) AS Q1  LEFT OUTER JOIN Mx_STAGEMASTER AS P4 ON Q1.stageid = P4.Stage_id
      GROUP BY Stage_name, Stageid, SHIFT_ID, LINE1
      ORDER BY Stageid
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    res.status(500).send('Error fetching data from the database');
  } finally {
    await sql.close();
  }
});


app.get('/api/attendance/allot', async (req, res) => {
  const { date, shiftId, stageName, line } = req.query;

  const query = `
SELECT DISTINCT USERID, NAME, Stage_name, SHIFT_ID, LINE1 AS LINE
   FROM (
      SELECT Q1.*,
        CASE WHEN ISNULL(PUNCHDATE, '') = '' THEN 1 ELSE 0 END AS ABSENT,
        CASE WHEN ISNULL(PUNCHDATE, '') <> '' THEN 1 ELSE 0 END AS PRESENT,
        1 AS ALLOT,
   CASE WHEN ISNULL(NSTAGE_ID,0)<>0 THEN NSTAGE_ID ELSE STAGE_ID END AS STAGEID,
                 CASE WHEN ISNULL(NLINE,'')<>'' THEN NLINE ELSE LINE END AS LINE1
      FROM (
        SELECT P1.USERID, P1.SHIFT_ID, P1.LINE, P3.SFTName, P1.STAGE_ID, P5.Name AS CGNAME, P2.NAME,
          (SELECT TOP 1 P5.Edatetime
           FROM Mx_ATDEventTrn AS P5
           WHERE P5.USERID = P1.USERID AND DATEADD(d, DATEDIFF(d, 0, P5.EDATETIME), 0) = P1.Shift_date_from
           ORDER BY P5.Edatetime) AS PUNCHDATE,

 (SELECT TOP 1 P5.STAGE_ID
                      FROM Mx_Userswap  AS P5
                      WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                      ORDER BY P5.SHIFT_DATE) AS NSTAGE_ID,
                     (SELECT TOP 1 P5.LINE
                      FROM Mx_Userswap  AS P5
                      WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                      ORDER BY P5.SHIFT_DATE) AS NLINE
        FROM Mx_UserShifts AS P1
        LEFT JOIN [Mx_ShiftMst] AS P3 ON P1.SHIFT_ID = P3.SFTID
        LEFT JOIN MX_USERMST AS P2 ON P1.USERID = P2.USERID
		LEFT JOIN Mx_STAGEMASTER AS P4 ON P1.stage_id = P4.Stage_id
        LEFT JOIN Mx_CustomGroup1Mst AS P5 ON P2.CG1ID = P5.CG1ID
        WHERE Shift_date_from = @date
          AND ISNULL(P2.UserIDEnbl, 0) = 1
          AND P1.SHIFT_ID = @shiftId
      ) AS Q1
    ) AS Q1
        LEFT JOIN Mx_STAGEMASTER AS P4 ON Q1.stageid = P4.Stage_id

    WHERE  P4.Stage_name = @stageName
	AND Q1.LINE1 = @line
	    ORDER BY STAGE_NAME, SHIFT_ID, USERID;`;

  try {
    let pool = await sql.connect(config);
    const results = await pool.request()
      .input('date', sql.Date, date)
      .input('shiftId', sql.VarChar, shiftId)
      .input('stageName', sql.VarChar, stageName)
      .input('line', sql.VarChar, line)
      .query(query);

    res.json(results.recordset);
  } catch (error) {
    console.error('Error fetching allot records:', error);
    res.status(500).send({ error: 'Server Error', details: error.message });
  }
});

app.get('/api/attendance/present', async (req, res) => {
  let pool = await sql.connect(config);
  const { date, shiftId, stageName, line } = req.query;

  const query = `
SELECT DISTINCT USERID, NAME, Stage_name, SHIFT_ID, LINE1 AS LINE
   FROM (
      SELECT Q1.*,
        CASE WHEN ISNULL(PUNCHDATE, '') = '' THEN 1 ELSE 0 END AS ABSENT,
        CASE WHEN ISNULL(PUNCHDATE, '') <> '' THEN 1 ELSE 0 END AS PRESENT,
        1 AS ALLOT,
   CASE WHEN ISNULL(NSTAGE_ID,0)<>0 THEN NSTAGE_ID ELSE STAGE_ID END AS STAGEID,
                 CASE WHEN ISNULL(NLINE,'')<>'' THEN NLINE ELSE LINE END AS LINE1
      FROM (
        SELECT P1.USERID, P1.SHIFT_ID, P1.LINE, P3.SFTName, P1.STAGE_ID, P5.Name AS CGNAME, P2.NAME,
          (SELECT TOP 1 P5.Edatetime
           FROM Mx_ATDEventTrn AS P5
           WHERE P5.USERID = P1.USERID AND DATEADD(d, DATEDIFF(d, 0, P5.EDATETIME), 0) = P1.Shift_date_from
           ORDER BY P5.Edatetime) AS PUNCHDATE,

 (SELECT TOP 1 P5.STAGE_ID
                      FROM Mx_Userswap  AS P5
                      WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                      ORDER BY P5.SHIFT_DATE) AS NSTAGE_ID,
                     (SELECT TOP 1 P5.LINE
                      FROM Mx_Userswap  AS P5
                      WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                      ORDER BY P5.SHIFT_DATE) AS NLINE
        FROM Mx_UserShifts AS P1
        LEFT JOIN [Mx_ShiftMst] AS P3 ON P1.SHIFT_ID = P3.SFTID
        LEFT JOIN MX_USERMST AS P2 ON P1.USERID = P2.USERID
		LEFT JOIN Mx_STAGEMASTER AS P4 ON P1.stage_id = P4.Stage_id
        LEFT JOIN Mx_CustomGroup1Mst AS P5 ON P2.CG1ID = P5.CG1ID
        WHERE Shift_date_from = @date
          AND ISNULL(P2.UserIDEnbl, 0) = 1
          AND P1.SHIFT_ID = @shiftId
      ) AS Q1
    ) AS Q1
        LEFT JOIN Mx_STAGEMASTER AS P4 ON Q1.stageid = P4.Stage_id

    WHERE ISNULL(PUNCHDATE, '') <> ''
	AND P4.Stage_name = @stageName
	AND Q1.LINE1 = @line
	    ORDER BY STAGE_NAME, SHIFT_ID, USERID;
  `;

  try {
    const results = await pool.request()
      .input('date', sql.Date, date)
      .input('shiftId', sql.VarChar, shiftId)
      .input('stageName', sql.VarChar, stageName)
      .input('line', sql.Char, line)
      .query(query);
    console.log(results.recordset);
    res.json(results.recordset);
  } catch (error) {
    console.error('Error fetching present records:', error);
    res.status(500).send({ error: 'Server Error', details: error.message });
  }
});
app.get('/api/attendance/absent', async (req, res) => {
  let pool = await sql.connect(config);
  const { date, shiftId, stageName, line } = req.query;

  const query = `
SELECT DISTINCT USERID, NAME, Stage_name, SHIFT_ID, LINE1 AS LINE,
	 (SELECT TOP 1 SWAP_USERID+'-'+P6A.NAME  FROM MX_USERSWAP AS P6 
		 LEFT OUTER JOIN Mx_UserMst AS P6A ON P6.Swap_userid = P6A.USERID 
		 WHERE P6.SHIFT_DATE=@date 
				 AND P6.Absent_userid = Q1.userid AND P6.Shift_id = Q1.SHIFT_ID AND P6.Line = Q1.LINE1 ) AS SWAPUSERNAME 
   FROM (
      SELECT Q1.*,
        CASE WHEN ISNULL(PUNCHDATE, '') = '' THEN 1 ELSE 0 END AS ABSENT,
        CASE WHEN ISNULL(PUNCHDATE, '') <> '' THEN 1 ELSE 0 END AS PRESENT,
        1 AS ALLOT,
   CASE WHEN ISNULL(NSTAGE_ID,0)<>0 THEN NSTAGE_ID ELSE STAGE_ID END AS STAGEID,
                 CASE WHEN ISNULL(NLINE,'')<>'' THEN NLINE ELSE LINE END AS LINE1
      FROM (
        SELECT P1.USERID, P1.SHIFT_ID, P1.LINE, P3.SFTName, P1.STAGE_ID, P5.Name AS CGNAME, P2.NAME,
          (SELECT TOP 1 P5.Edatetime
           FROM Mx_ATDEventTrn AS P5
           WHERE P5.USERID = P1.USERID AND DATEADD(d, DATEDIFF(d, 0, P5.EDATETIME), 0) = P1.Shift_date_from
           ORDER BY P5.Edatetime) AS PUNCHDATE,

 (SELECT TOP 1 P5.STAGE_ID
                      FROM Mx_Userswap  AS P5
                      WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                      ORDER BY P5.SHIFT_DATE) AS NSTAGE_ID,
                     (SELECT TOP 1 P5.LINE
                      FROM Mx_Userswap  AS P5
                      WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                      ORDER BY P5.SHIFT_DATE) AS NLINE
        FROM Mx_UserShifts AS P1
        LEFT JOIN [Mx_ShiftMst] AS P3 ON P1.SHIFT_ID = P3.SFTID
        LEFT JOIN MX_USERMST AS P2 ON P1.USERID = P2.USERID
		LEFT JOIN Mx_STAGEMASTER AS P4 ON P1.stage_id = P4.Stage_id
        LEFT JOIN Mx_CustomGroup1Mst AS P5 ON P2.CG1ID = P5.CG1ID
        WHERE Shift_date_from = @date
          AND ISNULL(P2.UserIDEnbl, 0) = 1
          AND P1.SHIFT_ID = @shiftId
      ) AS Q1
    ) AS Q1
        LEFT JOIN Mx_STAGEMASTER AS P4 ON Q1.stageid = P4.Stage_id

    WHERE ISNULL(PUNCHDATE, '') = ''
	AND P4.Stage_name = @stageName
	AND Q1.LINE1 = @line
	    ORDER BY STAGE_NAME, SHIFT_ID, USERID;
  `;

  try {
    const results = await pool.request()
      .input('date', sql.Date, date)
      .input('shiftId', sql.VarChar, shiftId)
      .input('stageName', sql.VarChar, stageName)
      .input('line', sql.Char, line)
      .query(query);
    console.log(results.recordset);
    res.json(results.recordset);
  } catch (error) {
    console.error('Error fetching absent records:', error);
    res.status(500).send({ error: 'Server Error', details: error.message });
  }
});


app.use(express.static(path.join(__dirname, '../master/public')));

app.get('/download-template', (req, res) => {
  const filePath = path.join(__dirname, '../master/public', 'sample_template.xlsx');
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
    }
  });
});

app.get('/api/shifts', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    const result = await pool.request().query(`SELECT DISTINCT SHIFT_ID FROM Mx_UserShifts;`);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching shifts:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/lines', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    const result = await pool.request().query(`SELECT DISTINCT LINE FROM Mx_UserShifts;`);
    console.log(result.recordset);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching lines:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/attendance/showAll', async (req, res) => {
  let pool = await sql.connect(config);
  const { date, shifts, lines } = req.query;

  // Build the query dynamically based on parameters
  const shiftParams = shifts.split(',').map((_, index) => `@shift${index}`).join(',');
  const lineParams = lines.split(',').map((_, index) => `@line${index}`).join(',');

  const query = `SELECT DISTINCT USERID, NAME, Stage_name, Stage_id, LINE, SHIFT_ID,
    CASE 
        WHEN ISNULL(PUNCHDATE, '') = '' THEN 'Absent' 
        ELSE 'Present' 
    END AS STATUS
  FROM (
    SELECT Q1.*,
    CASE 
        WHEN ISNULL(PUNCHDATE, '') = '' THEN 1 
        ELSE 0 
    END AS ABSENT,
    CASE 
        WHEN ISNULL(PUNCHDATE, '') <> '' THEN 1 
        ELSE 0 
    END AS PRESENT,
    1 AS ALLOT 
      FROM (
        SELECT P1.USERID, P1.SHIFT_ID, P1.LINE, P3.SFTName, P1.STAGE_ID, P5.Name AS CGNAME, P2.NAME,p4.stage_name,
          (SELECT TOP 1 P5.Edatetime
           FROM Mx_ATDEventTrn AS P5
           WHERE P5.USERID = P1.USERID AND DATEADD(d, DATEDIFF(d, 0, P5.EDATETIME), 0) = P1.Shift_date_from
           ORDER BY P5.Edatetime) AS PUNCHDATE
      FROM Mx_UserShifts AS P1
      LEFT JOIN [Mx_ShiftMst] AS P3 ON P1.SHIFT_ID = P3.SFTID 
      LEFT JOIN MX_USERMST AS P2 ON P1.USERID = P2.USERID 
      LEFT JOIN Mx_STAGEMASTER AS P4 ON P1.stage_id = P4.Stage_id 
      LEFT JOIN Mx_CustomGroup1Mst AS P5 ON P2.CG1ID = P5.CG1ID
      WHERE Shift_date_from = @date 
        AND ISNULL(P2.UserIDEnbl, 0) = 1  
        AND P1.SHIFT_ID IN (${shiftParams})
        AND P1.LINE IN (${lineParams})
    ) AS Q1
  ) AS Q1 
  ORDER BY Stage_id, STAGE_NAME, SHIFT_ID, USERID, LINE`;

  try {
    const request = pool.request().input('date', sql.Date, date);
    shifts.split(',').forEach((shift, index) => request.input(`shift${index}`, sql.VarChar, shift));
    lines.split(',').forEach((line, index) => request.input(`line${index}`, sql.VarChar, line));

    const results = await request.query(query);
    res.json(results.recordset);
  } catch (error) {
    console.error('Error fetching allot records:', error.message);
    res.status(500).send({ error: 'Server Error', details: error.message });
  }
});


app.get('/api/getEmployees', async (req, res) => {
  const { date, shiftId, Stage_name } = req.query;
  console.log({ date, shiftId, Stage_name });

  if (!date || !shiftId) {
    return res.status(400).json({ error: 'Date and Shift ID are required parameters.' });
  }

  const query = `SELECT DISTINCT USERID, NAME, Stage_name, SHIFT_ID, LINE1 AS LINE,
(SELECT TOP 1 Skill_Description  FROM Mx_UserSkills AS P1
LEFT OUTER JOIN MX_SKILLMASTER AS P2 ON P1.Skill_id = P2.Skill_id WHERE
Q1.userid = P1.userid ORDER BY  P1.UPDATE_AT DESC,P1.SKILL_ID DESC) AS SKILL_DESCRIPTION
            FROM (
                SELECT Q1.*,
                    CASE WHEN ISNULL(PUNCHDATE, '') = '' THEN 1 ELSE 0 END AS ABSENT,
                    CASE WHEN ISNULL(PUNCHDATE, '') <> '' THEN 1 ELSE 0 END AS PRESENT,
                    1 AS ALLOT,
                    CASE WHEN ISNULL(NSTAGE_ID, 0) <> 0 THEN NSTAGE_ID ELSE STAGE_ID END AS STAGEID,
                    CASE WHEN ISNULL(NLINE, '') <> '' THEN NLINE ELSE LINE END AS LINE1
                FROM (
                    SELECT P1.USERID, P1.SHIFT_ID, P1.LINE, P3.SFTName, P1.STAGE_ID, P5.Name AS CGNAME, P2.NAME,
                        (SELECT TOP 1 P5.Edatetime
                         FROM Mx_ATDEventTrn AS P5
                         WHERE P5.USERID = P1.USERID AND DATEADD(d, DATEDIFF(d, 0, P5.EDATETIME), 0) = P1.Shift_date_from
                         ORDER BY P5.Edatetime) AS PUNCHDATE,

                        (SELECT TOP 1 P5.STAGE_ID
                         FROM Mx_Userswap AS P5
                         WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                         ORDER BY P5.SHIFT_DATE) AS NSTAGE_ID,

                        (SELECT TOP 1 P5.LINE
                         FROM Mx_Userswap AS P5
                         WHERE P5.SWAP_USERID = P1.USERID AND P5.SHIFT_DATE = P1.Shift_date_from
                         ORDER BY P5.SHIFT_DATE) AS NLINE
                    FROM Mx_UserShifts AS P1
                    LEFT JOIN [Mx_ShiftMst] AS P3 ON P1.SHIFT_ID = P3.SFTID
                    LEFT JOIN MX_USERMST AS P2 ON P1.USERID = P2.USERID
                    LEFT JOIN Mx_STAGEMASTER AS P4 ON P1.stage_id = P4.Stage_id
                    LEFT JOIN Mx_CustomGroup1Mst AS P5 ON P2.CG1ID = P5.CG1ID
                    WHERE Shift_date_from = @date
                        AND ISNULL(P2.UserIDEnbl, 0) = 1
                      AND SHIFT_ID = @shiftId
                ) AS Q1
            ) AS Q1
            LEFT JOIN Mx_STAGEMASTER AS P4 ON Q1.stageid = P4.Stage_id
            WHERE ISNULL(PUNCHDATE, '') <> '' AND P4.STAGE_NAME != @Stage_name
AND USERID NOT IN
(SELECT Swap_userid from Mx_Userswap where Shift_date = @date)
            ORDER BY STAGE_NAME, SHIFT_ID, USERID;`;

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('date', sql.Date, date)
      .input('shiftId', sql.VarChar, shiftId)
      .input('Stage_name', sql.NVarChar, Stage_name)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Error fetching employees');
  }
});

app.post('/api/saveUserSwap', async (req, res) => {
  const swapRecords = req.body;

  try {
    const pool = await sql.connect(config);

    for (const swap of swapRecords) {
      const { shiftDate, Stage_name, shiftId, line, absentUserId, swapUserId } = swap;

      // Fetch Stage_id
      const result = await pool.request()
        .input('StageName', sql.NVarChar, Stage_name)
        .query('SELECT Stage_id FROM Mx_StageMaster WHERE Stage_name = @StageName');

      if (result.recordset.length === 0) {
        return res.status(400).send('Stage_name not found');
      }

      const stageId = result.recordset[0].Stage_id;

      // Insert swap details
      await pool.request()
        .input('ShiftDate', sql.DateTime, shiftDate)
        .input('StageId', sql.Int, stageId)
        .input('ShiftId', sql.Char(2), shiftId)
        .input('Line', sql.Char(2), line)
        .input('AbsentUserId', sql.NChar(15), absentUserId)
        .input('SwapUserId', sql.NChar(15), swapUserId)
        .query('INSERT INTO Mx_Userswap (Shift_date, Stage_id, Shift_id, Line, Absent_userid, Swap_userid) VALUES (@ShiftDate, @StageId, @ShiftId, @Line, @AbsentUserId, @SwapUserId)');
    }

    res.status(200).send('All swap details saved successfully');
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send(`Error saving swap details: ${err.message}`);
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
