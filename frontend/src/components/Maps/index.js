import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './index.css'
import { getKey } from '../../store/maps';
import Maps from './Maps';

const MapContainer = ({center, lat, lng, price}) => {
  // console.log('were just following the flow')
  const key = useSelector((state) => state.maps.key);

  const dispatch = useDispatch();
  const containerStyle = {
    width: '100%',
    height: '500px',
  };

  useEffect(() => {
    if (!key) {
      dispatch(getKey());

    }
  }, [dispatch, key]);

  if (!key) {
    return null;
  }

  return (
    <Maps apiKey={key} center={center} lat={parseFloat(lat)} lng={parseFloat(lng)} price={price} containerStyle={containerStyle} scrollwheel={false}/>
  );
};

export default MapContainer;


export function MapContainer2({center, lat, lng, price}){

  const key = useSelector((state) => state.maps.key);
  const dispatch = useDispatch();

  const containerStyle = {
    width: '100%',
    height: '100%',
  };

  useEffect(() => {
    if (!key) {
      dispatch(getKey());
      console.log('we are getting the key')
    }
  }, [dispatch, key]);

  if (!key) {
    return null;
  }

  return (
    <div style={{width: '75vw', height: '80vh', overflow: 'hidden', borderRadius: '10px'}}>
      <Maps apiKey={key} center={center} lat={parseFloat(lat)} lng={parseFloat(lng)} price={price} containerStyle={containerStyle} scrollwheel={true} />
    </div>
  );
}
