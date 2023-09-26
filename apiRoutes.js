const express = require('express');
const router = express.Router();
const db = require('./dbconfig')

router.get('/orders', (req, res) => {
    // Mencari semua parameter yang memiliki awalan 'conditions'.
    const conditionParameters = Object.keys(req.query).filter((param) =>
      param.startsWith('conditions')
    );
  
    if (conditionParameters.length === 0) {
      const query = 'SELECT * FROM ordersNew'
      db.query(query, (error, results) => {
        if (error) {
          res.status(500).json({ error: 'Terjadi kesalahan dalam mengambil data.' });
          return;
        }
        res.json(results);
      });
      return
    }
  
    // Membangun kueri SQL berdasarkan semua kondisi yang ada.
    const conditionClauses = [];
  
    conditionParameters.forEach((conditionParameter, index) => {
      const conditions = req.query[conditionParameter];
  
      try {
        const parsedConditions = JSON.parse(conditions);
  
        const conditionClause = [];
  
        for (const key in parsedConditions) {
          if (parsedConditions.hasOwnProperty(key)) {
            const values = parsedConditions[key];
  
            if (key === 'start_date' && parsedConditions.hasOwnProperty('end_date')) {
              // Jika ada 'start_date' dan 'end_date', dan 'end_date' tidak sama dengan 'start_date', gunakan kriteria rentang tanggal.
              if (values !== parsedConditions.end_date) {
                conditionClause.push(`order_date BETWEEN '${values}' AND '${parsedConditions.end_date}'`);
              }
            } else if (key === 'more_than') {
              conditionClause.push(`order_date > '${values}'`);
            } else if (key === 'less_than') {
              conditionClause.push(`order_date < '${values}'`);
            } else if (key !== 'end_date') {
              // Tambahkan semua kondisi kecuali 'end_date'.
              if (Array.isArray(values)) {
                const subQuery = values.map((value) => `${key} = '${value}'`).join(' OR ');
                conditionClause.push(`(${subQuery})`);
              } else {
                conditionClause.push(`${key} = '${values}'`);
              }
            }
          }
        }
  
        if (conditionClause.length > 0) {
          conditionClauses.push(`(${conditionClause.join(' AND ')})`);
        }
      } catch (error) {
        res.status(400).json({ error: `Format parameter ${conditionParameter} tidak valid.` });
        return;
      }
    });
  
    if (conditionClauses.length > 0) {
      const operators = [];
      for (let i = 1; i < conditionParameters.length; i++) {
        operators.push(req.query[`operator${i}`] || 'AND');
      }
      let sql = conditionClauses[0];
      for (let i = 1; i < conditionClauses.length; i++) {
        sql += ` ${operators[i - 1]} ${conditionClauses[i]}`;
      }
      sql = 'SELECT * FROM ordersNew WHERE ' + sql
      console.log(sql)
      // Menjalankan kueri SQL.
      db.query(sql, (error, results) => {
        if (error) {
          res.status(500).json({ error: 'Terjadi kesalahan dalam mengambil data.' });
          return;
        }
        res.json(results);
      });
    } else {
      res.status(400).json({ error: 'Tidak ada kondisi yang valid.' });
    }
});

router.post('/orders', (req, res) => {
  const { conditions, operators } = req.body;
  let query = '';
  const values = [];

  // Loop melalui setiap kondisi
  conditions.forEach((condition, index) => {
    const { id, Supplier_Name, Service, order_date } = condition;
    const { operator: suplierOperator, value: suplierValue } = Supplier_Name;
    const { operator: serviceOperator, value: serviceValue } = Service;
    const { operator: dateOperator, startDate, endDate, aDates } = order_date;

    query += ` (`;

    // Filter berdasarkan Supplier_Name
    if (Array.isArray(suplierValue)) {
      query += `Supplier_Name IN (?) AND `;
      values.push(suplierValue);
    } else {
      query += `Supplier_Name ${suplierOperator === 'is' ? '=' : '!='} ? AND `;
      values.push(suplierValue);
    }
    
    // Filter berdasarkan Service
    if (Array.isArray(serviceValue)) {
      query += `Service IN (?) AND `;
      values.push(serviceValue);
    } else {
      query += `Service ${serviceOperator === 'is' ? '=' : '!='} ? AND `;
      values.push(serviceValue);
    }
    
    // Filter berdasarkan order_date
    if (dateOperator === 'between') {
      query += `order_date BETWEEN ? AND ?`;
      values.push(startDate, endDate);
    } else if (dateOperator === 'more then') {
      query += `order_date > ?`;
      values.push(aDates);
    } else if (dateOperator === 'less then') {
      query += `order_date < ?`;
      values.push(aDates);
    }

    query += `)`;

    // Tambahkan operator logika sesuai dengan hubungan antar kondisi
    if (index < operators.length) {
      query += ` ${operators[index].operator} `;
    }
    
  });

  query = 'SELECT * FROM ordersNew WHERE' + query;

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

router.get('/orders/supplier', (req, res) => {
  const query = `SELECT DISTINCT Supplier_Name
    FROM ordersNew
    ORDER BY Supplier_Name ASC;`

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      // Manipulasi hasil query untuk mendapatkan array Supplier_Name
      const supplierNames = results.map(result => result.Supplier_Name);

      // Kirim array Supplier_Name sebagai respons
      res.json(supplierNames);
    }
  });
});

router.get('/orders/service', (req, res) => {
  const query = `SELECT DISTINCT Service
    FROM ordersNew
    ORDER BY Service ASC;`

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      // Manipulasi hasil query untuk mendapatkan array Supplier_Name
      const supplierNames = results.map(result => result.Service);

      // Kirim array Supplier_Name sebagai respons
      res.json(supplierNames);
    }
  });
});

module.exports = router;
