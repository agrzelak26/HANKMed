"use client";
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './registerTest.css';
import { useRouter } from 'next/navigation';
import { ref, set, getDatabase } from 'firebase/database'; // Poprawne importy dla Realtime Database
import { auth } from "../firebase"; // Import auth z firebase.js

function RegisterTest() {
  const router = useRouter();
  const navigateTo = (path) => () => router.push(path);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [hasReferral, setHasReferral] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [confirmationDetails, setConfirmationDetails] = useState(null);

  const categories = {
    'Badania laboratoryjne': ['Morfologia', 'Glukoza', 'Cholesterol', 'Elektrolity'],
    'Diagnostyka obrazowa': ['USG jamy brzusznej', 'RTG płuc', 'MRI'],
    'Badania funkcjonalne': ['EKG', 'Spirometria', 'Holter EKG'],
    'Endoskopia': ['Gastroskopia', 'Kolonoskopia'],
    'Profilaktyczne i przesiewowe': ['Cytologia', 'Mammografia', 'Badanie przesiewowe cukrzycy'],
    'Szczepienia': ['Grypa', 'COVID-19', 'HPV']
  };

  const slots = ['09:00', '10:30', '13:00'];

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setAvailableTests(categories[category] || []);
    setSelectedTest('');
    setSelectedDate(null);
    setSelectedSlot('');
    setHasReferral(null);
    setReferralCode('');
  };

  const handleTestChange = (e) => {
    setSelectedTest(e.target.value);
    setSelectedDate(null);
    setSelectedSlot('');
    setHasReferral(null);
    setReferralCode('');
  };

  const handleReferralChange = (e) => {
    setHasReferral(e.target.value === 'yes');
    setReferralCode('');
  };

  const handleReferralCodeChange = (e) => {
    const code = e.target.value;
    setReferralCode(code);
  };

  const isReferralCodeValid = referralCode.length === 4 && /^[0-9]+$/.test(referralCode);

  const clearFields = () => {
    setSelectedCategory('');
    setSelectedTest('');
    setAvailableTests([]);
    setSelectedDate(null);
    setSelectedSlot('');
    setConfirming(false);
    setHasReferral(null);
    setReferralCode('');
  };


  const closeConfirmationModal = () => {
    setConfirmationDetails(null);
    clearFields();
  };

  const isSubmitDisabled =
    !(selectedCategory && selectedTest && selectedDate && selectedSlot) ||
    (hasReferral && !isReferralCodeValid);

  const tileDisabled = ({ date }) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  function confirmAppointment() {
    const { testId, appointment } = confirmingAppointment;

  
    const user = auth.currentUser;

    if (user) {
    
      const db = getDatabase(); // Pobranie instancji bazy
      const userAppointmentsRef = ref(db, 'appointments/' + user.uid); // Referencja do użytkownika

      set(userAppointmentsRef, {
        testId,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        price: appointment.price,
        testName: tests.find(test => test.id === testId).name,
      })
      .then(() => {
        setTests((prevTests) => prevTests.map((test) => 
          test.id === testId ? {
            ...test,
            availability: test.availability.filter(
              (a) => a.date !== appointment.date || a.time !== appointment.time
            ),
          }
          : test
        ));
        setConfirmingAppointment(null);
        alert('Test zapisany pomyślnie!');
      })
      .catch((error) => {
        console.error("Error writing to Firebase: ", error);
        alert('Wystąpił błąd podczas zapisywania testu.');
      });
    } else {
      alert('Brak zalogowanego użytkownika');
    }
  }



  return (
    <div className="mainContainer">
      <h1>Zapisz się na badanie</h1>
      <div className="formWrapper">
        <div className="formContainer">
          <div className="formFields">
            <label>
              Wybierz kategorię badania:
              <select value={selectedCategory} onChange={handleCategoryChange}>
                <option value="">-- Wybierz --</option>
                {Object.keys(categories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            {availableTests.length > 0 && (
              <label>
                Wybierz rodzaj badania:
                <select value={selectedTest} onChange={handleTestChange}>
                  <option value="">-- Wybierz --</option>
                  {availableTests.map((test) => (
                    <option key={test} value={test}>
                      {test}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {selectedTest && (
            <>
              <div className="referralContainer">
                <h3>Czy posiadasz skierowanie na badanie?</h3>
                <div className="referralOptions">
                  <label>
                    <input
                      type="radio"
                      value="yes"
                      checked={hasReferral === true}
                      onChange={handleReferralChange}
                    />
                    Tak
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="no"
                      checked={hasReferral === false}
                      onChange={handleReferralChange}
                    />
                    Nie
                  </label>
                </div>

                {hasReferral && (
                <div className="referralInputContainer">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={handleReferralCodeChange}
                    maxLength="4"
                    placeholder="Wprowadź 4-cyfrowy kod skierowania"
                    className={`referralCodeInput ${
                      isReferralCodeValid ? 'valid' : referralCode.length > 0 ? 'error' : ''
                    }`}
                  />
                  {!isReferralCodeValid && referralCode.length > 0 && (
                    <p className="referralCodeMessage error">Nieprawidłowy kod skierowania!</p>
                  )}
                  {isReferralCodeValid && (
                    <p className="referralCodeMessage valid">✓ Kod poprawny!</p>
                  )}
                </div>
              )}
            </div>
          

              {(hasReferral === false || (hasReferral && isReferralCodeValid)) && (
                <div className="calendarContainer">
                  <h3>Wybierz datę:</h3>
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    minDate={new Date()}
                    tileDisabled={tileDisabled}
                  />
                </div>
              )}

              {selectedDate && (
                <div className="slotContainer">
                  <h3>Wybierz godzinę:</h3>
                  {slots.map((slot, index) => (
                    <div
                      key={index}
                      className={`slot ${selectedSlot === slot ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {selectedDate && (
          <button
            className={`submitButton ${isSubmitDisabled ? 'disabled' : 'enabled'}`}
            disabled={isSubmitDisabled}
            onClick={() => setConfirming(true)}
          >
            Zapisz się
          </button>
        )}
      </div>

      <div className="buttonContainer">
        <input
          className="inputButton"
          type="button"
          onClick={navigateTo('/dashboard')}
          value="Wróć do panelu głównego"
        />
      </div>

      {confirming && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h2>Potwierdzenie</h2>
            <p>
              Czy na pewno chcesz zapisać się na wizytę dnia{" "}
              {confirmingAppointment.appointment.date} o godzinie{" "}
              {confirmingAppointment.appointment.time}?
            </p>
            <div className="modalButtons">
              <button className="inputButton" onClick={confirmAppointment}>
                Tak, zapisz
              </button>
              <button className="inputButton" onClick={closeConfirmationModal}>
                Nie, wróć
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmationDetails && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h2>Gratulacje!</h2>
            <p>
              Zostałeś/aś zapisany na badanie <strong>{confirmationDetails.test}</strong> w dniu{' '}
              <strong>{confirmationDetails.date}</strong> o godzinie <strong>{confirmationDetails.slot}</strong>.
            </p>
            <div className="modalButtons">
              <button className="inputButton" onClick={closeConfirmationModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterTest;
