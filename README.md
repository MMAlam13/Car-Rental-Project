# Car-Rental-Project
This Car Rental Booking System MVP successfully addresses the core challenges of traditional rentaloperations while providing a foundation for future growth. The system demonstrates significant technicalachievements in conflict prevention, real-time availability, and user experience optimization.

**A minimal yet complete Car Rental Booking System with:**

• Node.js + Express.js (REST API backend) <br>
• MongoDB (via Mongoose) <br>
• HTML/CSS/JavaScript frontend <br>
• Modern admin panel and booking UI <br>

**🚗 Features:**

• Browse, filter, and search available cars <br>
• Real-time booking with double-booking protection <br>
• See and manage your bookings by email (no registration needed) <br>
• Admin panel for car and booking CRUD, status, and returns <br>
• Responsive frontend (Desktop & Mobile) <br>
• Seed data for quick demo <br>
• Simple JWT-based admin authentication (optional) <br>
• Ultra portable: just Node and MongoDB, no frameworks or build steps <br>

Car-Rental-/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Car.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── cars.js
│   │   └── bookings.js
│   ├── middleware/
│   │   └── validation.js
│   └── utils/
│       └── helpers.js
├── frontend/
│   ├── index.html
│   ├── booking.html
│   ├── admin.html
│   ├── my-bookings.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── booking.js
│       ├── admin.js
│       └── mybookings.js
└── README.md

**⚡️ Quickstart**

**1. Prerequisites**

- Node.js (v16 or newer) <br> 
- MongoDB Community (local or Atlas/Cloud) <br>

**2. Backend Setup**

  *cd backend* <br>
  *npm install* <br>

• Copy .env.example to .env if you want to set DB connection or admin credentials (optional) <br>
• By default, MongoDB must be running locally at *mongodb+srv://meraj_its_official:*************@cluster1305.vvfpr1n.mongodb.net/Meta_app* <br>

**Launch the API Server**

  *npm start* <br>

• App runs at *http://localhost:8000* <br>
• Health check at *http://localhost:8000/api/health* <br>

**3. Frontend Setup**

Open *frontend/* in VS Code <br>
**Recommended:** Serve files locally to avoid CORS issues:

  *cd frontend* <br>
  *python -m http.server 8000* <br>

Visit *http://localhost:8000/index.html* <br>
**Or:**Just double-click any *.html* file to open in your browser <br>

**🔧 Configuration**

**MongoDB** <br>
• Change MongoDB URI by setting environment variable in *backend/.env* <br>
    **MONGO_URI=** *mongodb+srv://meraj_its_official:*************@cluster1305.vvfpr1n.mongodb.net/Meta_app*

**Backend Port** <br>
• Default: 8000 <br>
• Change in *backend/server.js or via PORT=... in .env* <br>

**API URL in Frontend** <br>
• See *frontend/js/app.js* and other JS: <br>
  Const **API_BASE_URL =** *'http://localhost:8000/api'* <br>
• Update if you move *backend/server* <br>

**👩💻 Development Workflow**

•**Backend:** Edit files in *backend/, restart with npm start or use Live Reload with npx nodemon server.js* <br>
•**Frontend:** Edit files in *frontend/, just refresh browser* <br>

**🛠️ Core Endpoints**

• */api/cars* <br>
  • GET all cars, filterable <br> 
  • POST, PUT, DELETE (admin only) <br>

• */api/bookings* <br>
  • POST create <br
  • GET view, search <br>
  • /customer/:email to list bookings for a user <br> 
  • /[id]/cancel, /[id]/return (admin: change booking status) <br>

• */api/admin/login (admin JWT auth)* <br>

**👮 Admin Authentication (optional)**

**Default: No auth on CRUD** <br>
  • Enable by applying auth.protect middleware as described above <br>

**Admin login:** <br> 
  • Use the Admin panel <br> 
  • Username: admin <br> 
  • Password: password <br> 
  • Change with *ADMIN_USER, ADMIN_PASS env vars* <br>

**📊 Demo Use Cases**

• **User:** <br>
  1. Open *index.html → search cars → click Book* <br>
  2. Enter *info + dates → confirm* <br> 
  3. View all your bookings via "My Bookings" (enter email) <br> 

• **Admin:** <br> 
  1. Visit admin.html (get login modal if enabled) <br> 
  2. Add/edit/delete cars <br> 
  3. View bookings, mark return/cancel, see statuses <br> 

**🚀 Deployment & Customization** <br> 
  • Port to any cloud/PaaS with Node/Mongo support (Heroku, Render, Vercel, Railway, etc.) <br> 
  • For real-world use: add HTTPS, domain, reverse proxy, stronger auth, email notifications, etc <br>

**📝 License** <br>
  **IIT PATNA** <br>

**🙏 Credits** <br>
• **Starter system:** MD MERAJ ALAM <br> 
• **Stack:** Node.js, Express, MongoDB, Mongoose, Vanilla JS, HTML5, CSS3 <br> 

#THANK YOU !



  





