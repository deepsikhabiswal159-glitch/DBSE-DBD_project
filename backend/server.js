console.log('THIS IS THE UPDATED SERVER FILE')

const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Deepsikha@07',
  database: 'online_food_delivery'
})

db.connect((error) => {
  if (error) {
    console.log('Database connection failed:', error)
  } else {
    console.log('MySQL connected successfully!')
  }
})

app.get('/', (req, res) => {
  res.send('Online Food Delivery Backend is Running!')
})

app.get('/test-signup', (req, res) => {
  res.send('Signup route test is working!')
})

app.post('/login', (req, res) => {
  console.log('LOGIN ROUTE WAS CALLED!')
  console.log(req.body)

  const { email, password } = req.body

  const query = `
    SELECT * FROM users
    WHERE email = ? AND password = ?
  `

  db.query(query, [email, password], (error, results) => {
    if (error) {
      console.log(error)

      return res.status(500).json({
        message: 'Database error'
      })
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    res.status(200).json({
      message: 'Login successful!',
      user: results[0]
    })
  })
})

app.post('/signup', (req, res) => {
  console.log('SIGNUP ROUTE WAS CALLED!')
  console.log(req.body)

  const { name, email, password, phone } = req.body

  const checkUser = 'SELECT * FROM users WHERE email = ?'

  db.query(checkUser, [email], (error, results) => {
    if (error) {
      console.log(error)

      return res.status(500).json({
        message: 'Database error'
      })
    }

    if (results.length > 0) {
      return res.status(400).json({
        message: 'Email already exists!'
      })
    }

    const sql = `
      INSERT INTO users (name, email, password, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `

    db.query(
      sql,
      [name, email, password, phone, 'Customer'],
      (error, result) => {
        if (error) {
          console.log(error)

          return res.status(500).json({
            message: 'Unable to create account'
          })
        }

        res.status(201).json({
          message: 'Account created successfully!',
          userId: result.insertId
        })
      }
    )
  })
})

app.get('/restaurants', (req, res) => {
  db.query('SELECT * FROM restaurants', (error, results) => {
    if (error) {
      console.log(error)

      return res.status(500).json({
        message: 'Unable to fetch restaurants'
      })
    }

    res.json(results)
  })
})

app.get('/food-items', (req, res) => {
  db.query('SELECT * FROM food_items', (error, results) => {
    if (error) {
      console.log(error)

      return res.status(500).json({
        message: 'Unable to fetch food items'
      })
    }

    res.json(results)
  })
})

app.post('/place-order', (req, res) => {
  console.log('PLACE ORDER ROUTE WAS CALLED!')
  console.log(req.body)

  const { cart, total, userId } = req.body

  if (!cart || cart.length === 0) {
    return res.status(400).json({
      message: 'Cart is empty'
    })
  }

  if (!userId) {
    return res.status(400).json({
      message: 'User not logged in'
    })
  }

  const restaurantId = cart[0].restaurant_id || 1
  const addressId = 1

  const orderQuery = `
    INSERT INTO orders
    (user_id, restaurant_id, address_id, total_amount, order_status)
    VALUES (?, ?, ?, ?, ?)
  `

  db.query(
    orderQuery,
    [userId, restaurantId, addressId, total, 'Pending'],
    (error, result) => {
      if (error) {
        console.log(error)

        return res.status(500).json({
          message: 'Unable to place order'
        })
      }

      const orderId = result.insertId

      const orderItems = cart.map((item) => [
        orderId,
        item.food_id,
        item.quantity || 1,
        item.price
      ])

      const itemQuery = `
        INSERT INTO order_items
        (order_id, food_id, quantity, price)
        VALUES ?
      `

      db.query(itemQuery, [orderItems], (itemError) => {
        if (itemError) {
          console.log(itemError)

          return res.status(500).json({
            message: 'Order created but items could not be added'
          })
        }

        res.status(201).json({
          message: 'Order placed successfully!',
          orderId: orderId
        })
      })
    }
  )
})

app.get('/orders/:userId', (req, res) => {
  const userId = req.params.userId

  const query = `
    SELECT 
      orders.order_id,
      orders.order_date,
      orders.total_amount,
      orders.order_status,
      restaurants.name AS restaurant_name
    FROM orders
    LEFT JOIN restaurants 
      ON orders.restaurant_id = restaurants.restaurant_id
    WHERE orders.user_id = ?
    ORDER BY orders.order_date DESC
  `

  db.query(query, [userId], (error, results) => {
    if (error) {
      console.log(error)

      return res.status(500).json({
        message: 'Unable to fetch orders'
      })
    }

    res.status(200).json(results)
  })
})

app.put('/cancel-order/:orderId', (req, res) => {
  const orderId = req.params.orderId

  const query = `
    UPDATE orders
    SET order_status = 'Cancelled'
    WHERE order_id = ? AND order_status = 'Pending'
  `

  db.query(query, [orderId], (error, result) => {
    if (error) {
      console.log(error)

      return res.status(500).json({
        message: 'Unable to cancel order'
      })
    }

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: 'This order cannot be cancelled'
      })
    }

    res.status(200).json({
      message: 'Order cancelled successfully!'
    })
  })
})

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000')
  console.log('Login route is ready!')
  console.log('Signup route is ready!')
})