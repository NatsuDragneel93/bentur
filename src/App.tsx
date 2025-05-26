import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/login/Login';
import Home from './pages/home/Home';
import './App.scss';
import Tours from './pages/tours/Tours';
import ToDo from './pages/to-do/ToDo';
import ToBuy from './pages/to-buy/ToBuy';
import MyInventory from './pages/my-inventory/MyInventory';
import Manuals from './pages/manuals/Manuals';
import UsefulContacts from './pages/useful-contacts/UsefulContacts';
import Header from './components/Header';
import MyInventoryPersonal from './pages/my-inventory/personal/MyInventoryPersonal';
import MyInventoryTour from './pages/my-inventory/tour/MyInventoryTour';
// import { FirebaseProvider } from './context/firebase.context';

const App: React.FC = () => {
  return (
    // <div className="app-main-container">
    //   <FirebaseProvider>
    //     <Router>
    //       <Routes>
    //         <Route path="/" element={<Login />} />
    //         <Route path="/home" element={<Home />} />
    //       </Routes>
    //     </Router>
    //   </FirebaseProvider>
    // </div >

    // <div className="app-main-container">
    //   <Router>
    //     <Routes>
    //       <Route path="/" element={<Login />} />
    //       <Route path="/home" element={<Home />} />
    //       <Route path="/tours" element={<Tours />} />
    //       <Route path="/to-do" element={<ToDo />} />
    //       <Route path="/to-buy" element={<ToBuy />} />
    //       <Route path="/my-inventory" element={<MyInventory />} />
    //       <Route path="/manuals" element={<Manuals />} />
    //       <Route path="/useful-contacts" element={<UsefulContacts />} />
    //     </Routes>
    //   </Router>
    // </div >


    <div className="app-main-container">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/*"
            element={
              <>
                <Header />
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/tours" element={<Tours />} />
                  <Route path="/to-do" element={<ToDo />} />
                  <Route path="/to-buy" element={<ToBuy />} />
                  <Route path="/my-inventory" element={<MyInventory />} />
                  <Route path="/my-inventory/personal" element={<MyInventoryPersonal />} />
                  <Route path="/my-inventory/tour" element={<MyInventoryTour />} />
                  <Route path="/manuals" element={<Manuals />} />
                  <Route path="/useful-contacts" element={<UsefulContacts />} />
                </Routes>
              </>
            }
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;