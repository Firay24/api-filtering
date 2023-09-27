const express = require('express');
const router = express.Router();
const db = require('./dbconfig')

router.get('/orders', (req, res) => {
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
              if (values !== parsedConditions.end_date) {
                conditionClause.push(`order_date BETWEEN '${values}' AND '${parsedConditions.end_date}'`);
              }
            } else if (key === 'more_than') {
              conditionClause.push(`order_date > '${values}'`);
            } else if (key === 'less_than') {
              conditionClause.push(`order_date < '${values}'`);
            } else if (key !== 'end_date') {
              
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
    let qSupplier = ''
    let qService = ''
    let qDate = ''

    // Filter berdasarkan Supplier_Name
    if (suplierValue) {
      if (Array.isArray(suplierValue)) {
        qSupplier = `Supplier_Name IN (?)`;
        values.push(suplierValue);
      } else {
        qSupplier = `Supplier_Name ${suplierOperator === 'is' ? '=' : '!='} ? `;
        values.push(suplierValue);
      }
    };
    
    // Filter berdasarkan Service
    if (serviceValue) { 
      if (Array.isArray(serviceValue)) {
        qService = `Service IN (?)`;
        values.push(serviceValue);
      } else {
        qService = `Service ${serviceOperator === 'is' ? '=' : '!='} ?`;
        values.push(serviceValue);
      }
    }
    
    // Filter berdasarkan order_date
    if (dateOperator === 'between' && startDate && endDate) {
      qDate = `order_date BETWEEN ? AND ?`;
      values.push(startDate, endDate);
    } else if (dateOperator === 'more then' && aDates) {
      qDate = `order_date > ?`;
      values.push(aDates);
    } else if (dateOperator === 'less then' && aDates) {
      qDate = `order_date < ?`;
      values.push(aDates);
    }

    if (qSupplier) {
      query += qSupplier
      if (qService) {
        query += 'AND ' + qService
        if (qDate) {
          query += 'AND ' + qDate
        }
      } else {
        if (qDate) {
          query += 'AND ' + qDate
        }
      }
    } else if (qService) {
      query += qService
      if (qDate) {
        query += 'AND ' + qDate
      }
    } else if (qDate) {
      query += qDate
    }

    query += `)`;

    if (index < operators.length) {
      query += ` ${operators[index]} `;
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
      const supplierNames = results.map(result => result.Supplier_Name);
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
      const supplierNames = results.map(result => result.Service);
      res.json(supplierNames);
    }
  });
});

module.exports = router;
