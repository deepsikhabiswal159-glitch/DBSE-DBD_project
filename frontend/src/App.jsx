import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [isSignup, setIsSignup] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  const [loginError, setLoginError] = useState('')
  const [signupMessage, setSignupMessage] = useState('')

  const [restaurants, setRestaurants] = useState([])
  const [foodItems, setFoodItems] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  const [orders, setOrders] = useState([])
  const [showOrders, setShowOrders] = useState(false)
  const [ordersMessage, setOrdersMessage] = useState('')

  useEffect(() => {
    fetch('http://localhost:5000/restaurants')
      .then((response) => response.json())
      .then((data) => setRestaurants(data))
      .catch((error) => console.log(error))

    fetch('http://localhost:5000/food-items')
      .then((response) => response.json())
      .then((data) => setFoodItems(data))
      .catch((error) => console.log(error))
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setLoggedIn(true)
        setUser(data.user)
        setLoginError('')
        setPassword('')
        setMessage('')
      } else {
        setLoginError(data.message)
      }
    } catch (error) {
      setLoginError('Unable to connect to server')
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSignupMessage('🎉 Account created successfully! Please login.')

        setName('')
        setEmail('')
        setPassword('')
        setPhone('')

        setTimeout(() => {
          setIsSignup(false)
          setSignupMessage('')
        }, 1500)
      } else {
        setSignupMessage(data.message)
      }
    } catch (error) {
      setSignupMessage('Unable to connect to server')
    }
  }

  const addToCart = (food) => {
  const existingItem = cart.find(
    (item) => item.food_id === food.food_id
  )

  if (existingItem) {
    setCart(
      cart.map((item) =>
        item.food_id === food.food_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    )
  } else {
    setCart([
      ...cart,
      {
        ...food,
        quantity: 1
      }
    ])
  }

  setMessage('')
}
const increaseQuantity = (foodId) => {
  setCart(
    cart.map((item) =>
      item.food_id === foodId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    )
  )
}

const decreaseQuantity = (foodId) => {
  setCart(
    cart
      .map((item) =>
        item.food_id === foodId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0)
  )
}

  const removeFromCart = (index) => {
    setCart(cart.filter((_, itemIndex) => itemIndex !== index))
  }

  const filteredFoodItems = foodItems.filter((food) =>
    food.name.toLowerCase().includes(search.toLowerCase())
  )

  const total = cart.reduce(
  (sum, item) => sum + Number(item.price) * item.quantity,
  0
)

  const placeOrder = async () => {
    if (cart.length === 0) {
      setMessage('Your cart is empty!')
      return
    }

    if (!user) {
      setMessage('Please login before placing an order.')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart,
          total,
          userId: user.user_id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`🎉 Order placed successfully! Order ID: ${data.orderId}`)
        setCart([])
        setOrders([])
      } else {
        setMessage(data.message)
      }
    } catch (error) {
      setMessage('Something went wrong while placing the order.')
    }
  }

  const fetchOrders = async () => {
    if (!user) return

    try {
      const response = await fetch(
        `http://localhost:5000/orders/${user.user_id}`
      )

      const data = await response.json()

      if (response.ok) {
        setOrders(data)
        setOrdersMessage('')
        setShowOrders(true)

        setTimeout(() => {
          document.getElementById('orders')?.scrollIntoView({
            behavior: 'smooth'
          })
        }, 100)
      } else {
        setOrdersMessage(data.message || 'Unable to fetch orders')
      }
    } catch (error) {
      setOrdersMessage('Unable to connect to server')
    }
  }

  const cancelOrder = async (orderId) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this order?'
    )

    if (!confirmCancel) return

    try {
      const response = await fetch(
        `http://localhost:5000/cancel-order/${orderId}`,
        {
          method: 'PUT'
        }
      )

      const data = await response.json()

      if (response.ok) {
        setOrdersMessage('❌ Order cancelled successfully!')
        fetchOrders()
      } else {
        setOrdersMessage(
          data.message || 'This order cannot be cancelled'
        )
      }
    } catch (error) {
      setOrdersMessage('Unable to connect to server')
    }
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setUser(null)
    setCart([])
    setOrders([])
    setShowOrders(false)

    setEmail('')
    setPassword('')
    setLoginError('')
    setSignupMessage('')
    setMessage('')
    setOrdersMessage('')
  }

  if (!loggedIn && !isSignup) {
    return (
      <div className="login-page">
        <div className="login-box">
          <h1>FoodExpress 🍕</h1>

          <p>Login to order your favorite food</p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">
              Login 🍔
            </button>
          </form>

          {loginError && (
            <p className="login-error">
              {loginError}
            </p>
          )}

          <p className="switch-text">
            Don't have an account?
          </p>

          <button
            className="switch-button"
            onClick={() => {
              setIsSignup(true)
              setLoginError('')
            }}
          >
            Create Account ✨
          </button>
        </div>
      </div>
    )
  }

  if (!loggedIn && isSignup) {
    return (
      <div className="login-page">
        <div className="login-box signup-box">
          <h1>FoodExpress 🍕</h1>

          <p>Create your account and start ordering!</p>

          <form onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <button type="submit">
              Sign Up ✨
            </button>
          </form>

          {signupMessage && (
            <p className="signup-message">
              {signupMessage}
            </p>
          )}

          <p className="switch-text">
            Already have an account?
          </p>

          <button
            className="switch-button"
            onClick={() => {
              setIsSignup(false)
              setSignupMessage('')
            }}
          >
            Login Instead 🍕
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <nav>
        <h2>FoodExpress 🍕</h2>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#special">Special</a>
          <a href="#restaurants">Restaurants</a>
          <a href="#menu">Menu</a>

          <button
            className="orders-button"
            onClick={fetchOrders}
          >
            My Orders 📦
          </button>

          <button
            className="cart-button"
            onClick={() =>
              document.querySelector('.cart-section')?.scrollIntoView({
                behavior: 'smooth'
              })
            }
          >
            Cart 🛒 ({cart.length})
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      <section className="hero" id="home">
        <div>
          <h1>Delicious Food, Delivered Fast 🍔🍕</h1>

          <p>
            Order your favorite food from the best restaurants and cafés near you.
          </p>

          <button
            onClick={() =>
              document.getElementById('restaurants')?.scrollIntoView({
                behavior: 'smooth'
              })
            }
          >
            Explore Restaurants
          </button>
        </div>
      </section>

      <section className="special" id="special">
        <div className="special-content">
          <div>
            <p className="special-label">🔥 TODAY'S SPECIAL</p>

            <h2>Paneer Butter Masala</h2>

            <p>
              Creamy, delicious and freshly prepared for a perfect meal!
            </p>

            <h3>₹249</h3>

            <button
              onClick={() =>
                document.getElementById('menu')?.scrollIntoView({
                  behavior: 'smooth'
                })
              }
            >
              Order Now 🍴
            </button>
          </div>

          <div className="special-emoji">🍛</div>
        </div>
      </section>

      <section className="restaurants" id="restaurants">
        <h2>Popular Restaurants & Cafés ⭐</h2>

        <div className="restaurant-grid">
          {restaurants.map((restaurant, index) => (
            <div
              className="restaurant-card"
              key={restaurant.restaurant_id}
            >
              <div className="restaurant-image">🍽️</div>

              <h3>{restaurant.name}</h3>

              <p className="rating">
                ⭐ {index % 3 === 0 ? '4.8' : index % 3 === 1 ? '4.6' : '4.7'}
              </p>

              <p>📍 {restaurant.address}</p>
              <p>📞 {restaurant.phone}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="menu" id="menu">
        <h2>Explore Our Menu 🍴</h2>

        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Search for your favorite food..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="food-grid">
          {filteredFoodItems.length === 0 ? (
            <p className="no-food">
              No food items found 😭🍽️
            </p>
          ) : (
            filteredFoodItems.map((food) => (
              <div className="food-card" key={food.food_id}>
                <h4>{food.name}</h4>

                <p>{food.description}</p>

                <p className="food-price">
                  ₹{food.price}
                </p>

                <button onClick={() => addToCart(food)}>
                  Add to Cart
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {showOrders && (
        <section className="orders-section" id="orders">
          <h2>My Order History 📦</h2>

          {ordersMessage && (
            <p className="order-message">
              {ordersMessage}
            </p>
          )}

          {orders.length === 0 ? (
            <p className="no-orders">
              You haven't placed any orders yet 🍽️
            </p>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => (
                <div className="order-card" key={order.order_id}>
                  <h3>Order #{order.order_id}</h3>

                  <p>
                    🏪 {order.restaurant_name || 'Restaurant'}
                  </p>

                  <p>
                    📅 {new Date(order.order_date).toLocaleString()}
                  </p>

                  <p>
                    💰 ₹{order.total_amount}
                  </p>

                  <p className="order-status">
                    🚦 {order.order_status}
                  </p>

                  {order.order_status === 'Pending' && (
                    <button
                      className="cancel-button"
                      onClick={() => cancelOrder(order.order_id)}
                    >
                      Cancel Order ❌
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="cart-section">
        <h2>Your Cart 🛒</h2>

        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            {cart.map((item) => (
  <div className="cart-item" key={item.food_id}>
    <div>
      <h3>{item.name}</h3>
      <p>₹{item.price} each</p>
    </div>

    <div className="quantity-controls">
      <button
        onClick={() => decreaseQuantity(item.food_id)}
      >
        −
      </button>

      <span>{item.quantity}</span>

      <button
        onClick={() => increaseQuantity(item.food_id)}
      >
        +
      </button>
    </div>

    <div className="cart-total">
      ₹{Number(item.price) * item.quantity}
    </div>
  </div>
))}

            <h3>Total: ₹{total}</h3>

            <button
              className="order-button"
              onClick={placeOrder}
            >
              Place Order 🍕
            </button>
          </>
        )}

        {message && (
          <p className="order-message">
            {message}
          </p>
        )}
      </section>

      <footer>
        <h3>FoodExpress 🍕</h3>
        <p>Online Food Delivery Platform</p>
      </footer>
    </>
  )
}

export default App