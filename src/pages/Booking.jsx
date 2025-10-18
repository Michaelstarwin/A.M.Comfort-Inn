import React, { useState } from 'react';
import './Booking.css';

const Booking = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [formData, setFormData] = useState({
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    guests: '1',
    rooms: '1',
    roomType: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    idProofType: '',
    idProofNumber: '',
    mealPlan: [],
    pickup: '',
    extraBed: '',
    specialRequests: '',
    paymentMethod: '',
    advanceAmount: '',
    termsAccepted: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'termsAccepted') {
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else if (name === 'mealPlan') {
        setFormData(prev => ({
          ...prev,
          mealPlan: checked
            ? [...prev.mealPlan, value]
            : prev.mealPlan.filter(item => item !== value)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const checkAvailability = (e) => {
    e.preventDefault();

    if (!formData.checkInDate || !formData.checkOutDate || !formData.roomType) {
      setPopupMessage('Please fill in check-in date, check-out date, and room type to check availability.');
      setShowPopup(true);
      return;
    }

    setPopupMessage('Great news! Rooms are available for your selected dates. Please complete the booking form below.');
    setShowPopup(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      setPopupMessage('Please accept the terms and conditions to proceed.');
      setShowPopup(true);
      return;
    }

    if (!formData.name || !formData.phone || !formData.email) {
      setPopupMessage('Please fill in all required guest details.');
      setShowPopup(true);
      return;
    }

    setPopupMessage('Booking confirmed! Thank you for choosing A.M. Comfort Inn. We will contact you shortly with confirmation details.');
    setShowPopup(true);

    setTimeout(() => {
      setFormData({
        checkInDate: '',
        checkInTime: '',
        checkOutDate: '',
        checkOutTime: '',
        guests: '1',
        rooms: '1',
        roomType: '',
        name: '',
        phone: '',
        email: '',
        address: '',
        idProofType: '',
        idProofNumber: '',
        mealPlan: [],
        pickup: '',
        extraBed: '',
        specialRequests: '',
        paymentMethod: '',
        advanceAmount: '',
        termsAccepted: false
      });
    }, 3000);
  };

  return (
    <div className="booking">
      <div className="booking-hero">
        <div className="booking-hero-overlay"></div>
        <div className="booking-hero-content">
          <h1 className="animate-fade-in-up">Book Your Stay</h1>
          <p className="animate-fade-in-up">Reserve your perfect room at A.M. Comfort Inn</p>
        </div>
      </div>

      <div className="booking-content">
        <div className="container">
          <div className="booking-form-wrapper animate-fade-in-up">
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h2>Check Availability</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>Check-in Date *</label>
                    <input
                      type="date"
                      name="checkInDate"
                      value={formData.checkInDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Check-in Time</label>
                    <input
                      type="time"
                      name="checkInTime"
                      value={formData.checkInTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Check-out Date *</label>
                    <input
                      type="date"
                      name="checkOutDate"
                      value={formData.checkOutDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Check-out Time</label>
                    <input
                      type="time"
                      name="checkOutTime"
                      value={formData.checkOutTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Number of Guests *</label>
                    <select name="guests" value={formData.guests} onChange={handleChange} required>
                      {[1,2,3,4,5,6].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Number of Rooms *</label>
                    <select name="rooms" value={formData.rooms} onChange={handleChange} required>
                      {[1,2,3,4,5].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Room' : 'Rooms'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Room Type *</label>
                  <select name="roomType" value={formData.roomType} onChange={handleChange} required>
                    <option value="">Select Room Type</option>
                    <option value="standard">Standard Room - ₹2,000/night</option>
                    <option value="deluxe">Deluxe Room - ₹2,500/night</option>
                    <option value="premium">Premium Suite - ₹3,500/night</option>
                    <option value="family">Family Suite - ₹4,000/night</option>
                    <option value="executive">Executive Room - ₹3,000/night</option>
                  </select>
                </div>

                <button type="button" className="btn-check-availability" onClick={checkAvailability}>
                  Check Availability
                </button>
              </div>

              <div className="form-section">
                <h2>Guest Details</h2>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your complete address"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>ID Proof Type</label>
                    <select name="idProofType" value={formData.idProofType} onChange={handleChange}>
                      <option value="">Select ID Type</option>
                      <option value="aadhar">Aadhar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="passport">Passport</option>
                      <option value="driving">Driving License</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ID Proof Number</label>
                    <input
                      type="text"
                      name="idProofNumber"
                      value={formData.idProofNumber}
                      onChange={handleChange}
                      placeholder="Enter ID number"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Additional Preferences</h2>

                <div className="form-group">
                  <label>Meal Plan (Select all that apply)</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="mealPlan"
                        value="breakfast"
                        checked={formData.mealPlan.includes('breakfast')}
                        onChange={handleChange}
                      />
                      <span>Breakfast</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="mealPlan"
                        value="lunch"
                        checked={formData.mealPlan.includes('lunch')}
                        onChange={handleChange}
                      />
                      <span>Lunch</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="mealPlan"
                        value="dinner"
                        checked={formData.mealPlan.includes('dinner')}
                        onChange={handleChange}
                      />
                      <span>Dinner</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Pickup/Drop Service</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="pickup"
                        value="yes"
                        checked={formData.pickup === 'yes'}
                        onChange={handleChange}
                      />
                      <span>Yes, I need pickup/drop service</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="pickup"
                        value="no"
                        checked={formData.pickup === 'no'}
                        onChange={handleChange}
                      />
                      <span>No, thank you</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Extra Bed Required?</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="extraBed"
                        value="yes"
                        checked={formData.extraBed === 'yes'}
                        onChange={handleChange}
                      />
                      <span>Yes (Additional ₹500/night)</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="extraBed"
                        value="no"
                        checked={formData.extraBed === 'no'}
                        onChange={handleChange}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Special Requests</label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleChange}
                    placeholder="Any special requirements or requests?"
                    rows="4"
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>Payment Details</h2>

                <div className="form-group">
                  <label>Payment Method *</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required>
                    <option value="">Select Payment Method</option>
                    <option value="cash">Cash</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Advance Amount (Optional)</label>
                  <input
                    type="number"
                    name="advanceAmount"
                    value={formData.advanceAmount}
                    onChange={handleChange}
                    placeholder="Enter advance payment amount"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label terms-checkbox">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      required
                    />
                    <span>I accept the terms and conditions *</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-submit">
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setShowPopup(false)}>
              &times;
            </button>
            <div className="popup-message">
              <p>{popupMessage}</p>
            </div>
            <button className="popup-btn" onClick={() => setShowPopup(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
