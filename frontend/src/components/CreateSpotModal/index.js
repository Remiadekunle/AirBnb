import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useModal } from "../../context/Modal";
// import './SignupForm.css';
import { createSpot } from '../../store/spots'
import './index.css';


function CreateSpotModal() {
  const dispatch = useDispatch();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0)
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState([]);
  const { closeModal } = useModal();

  useEffect(() => {
    let newErrors = []

    if (price < 1) newErrors.push('Price needs to be greater than $0')
    if (description.length < 50) newErrors.push('Description needs to be atleast 50 chars')
    if (name.length < 1) newErrors.push('Name must be atleast 1 char')

    setErrors(newErrors)
  }, [address, city, state, country, name, description, price])

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors([]);
    const lat = 1;
    const lng = 2;

    const payload = {
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price
    }
    const payload2 = {
      url,
      preview: true
    }
    let errors;


    await dispatch(createSpot(payload, payload2)).then(closeModal).catch(async (res) => {
        const data = await res.json();
        if (data && data.errors) setErrors(Object.values(data.errors));
      });
    // console.log('this is the errors', errors)

    // dispatch(sessionActions.signup({ address, city, state, country, name, price }))
    // .then(closeModal)
    // .catch(async (res) => {
    //     const data = await res.json();
    //     if (data && data.errors) setErrors(data.errors);
    // });

    // return setErrors(['Confirm name field must be the same as the name field']);
    console.log('these are the errors', errors)
  };

  return (
    <>
      <h1>Create New Spot</h1>
      <form className="create-form" onSubmit={handleSubmit}>
        <div id="welcome-message">
          Welcome to FairBnB
        </div>
        <ul>
          {errors && errors.map((error, idx) => <li key={idx}>{error}</li>)}
        </ul>
        <label className="create-label">
          <div className="form-spot-details">
            Spot Details
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="address-input"
            autoFocus
            placeholder="Address"
          />
        </label>
        <label>

          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            placeholder="City"
          />
        </label>
        <label>

          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            placeholder="State"
          />
        </label>
        <label>

          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            placeholder="Country"
          />
        </label>
        <label>

          <input
            type="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="name"
          />
        </label>
        <label >

          <input
            type="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Description"
          />
        </label>
        <label>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="Url"
          />
        </label>
        <label >
          <div id="create-price">
            Price
          </div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            // defaultValue={'none'}
            placeholder="Price"
          />
        </label>
        <button className="submitButton" type="submit">Submit</button>
      </form>
    </>
  );
}

export default CreateSpotModal;
