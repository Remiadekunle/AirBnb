import { fetchSpots } from "../../store/spots"
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import SpotIndex from "./spotIndex";
import './homePage.css';
import { NavLink } from "react-router-dom";

export function Home({isHome, setIsHome}) {
    const dispatch = useDispatch();
    const initialSpots = useSelector(state => state.spots);

    useEffect(() => {
        dispatch(fetchSpots())
    }, [dispatch])

    if (Object.keys(initialSpots).length < 1){
        return null
    }
    const spots = Object.values(initialSpots.allSpots)

    return (
        <div>
            <div className="home-page-container">
                <div className="home-page">
                    {
                        spots.map(spot => (
                            <SpotIndex isHome={isHome} setIsHome={setIsHome} spot={spot} />
                        ))
                    }
                </div>
            </div>
            <div className="footer">
                <div className="app-copyright">
                    <i class="fa-regular fa-copyright fa-xs"></i>
                    <div>
                        2022 Fairbnb,Inc.
                    </div>
                </div>
                <div id="coding-components">
                    <span>React</span>
                    <span>{' · '}</span>
                    <span>Redux</span>
                    <span>{' · '}</span>
                    <span>JavaScript</span>
                </div>
            </div>
        </div>
    )
}

export default Home
