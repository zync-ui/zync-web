import { useEffect, useState } from 'react';
import './CustomLoader.css';
import zyncLogo from '../../assets/zync-logo.png';

export const CustomLoader = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        // Dots animation
        const dotInterval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
        }, 400);

        return () => {
            clearInterval(dotInterval);
        };
    }, []);

    return (
        <div className="loader-page-container">
            {/* Background particles */}
            <div className="bg-particle particle-1"></div>
            <div className="bg-particle particle-2"></div>
            <div className="bg-particle particle-3"></div>
            <div className="bg-particle particle-4"></div>

            <div className="loader-content">
                <div className="logo-wrapper">
                    <div className="accent-circle"></div>

                    <div className="glow-ring ring-1"></div>
                    <div className="glow-ring ring-2"></div>
                    <div className="glow-ring ring-3"></div>

                    <div className="hexagon-container">
                        <div className="hexagon hex-1"></div>
                        <div className="hexagon hex-2"></div>
                        <div className="hexagon hex-3"></div>
                        <div className="hexagon hex-4"></div>
                    </div>

                    <div className="orbit-container">
                        <div className="orbit orbit-1"><div className="orbit-dot"></div></div>
                        <div className="orbit orbit-2"><div className="orbit-dot"></div></div>
                        <div className="orbit orbit-3"><div className="orbit-dot"></div></div>
                    </div>

                    <div className="loader-logo">
                        <img src={zyncLogo} alt="Zync log" />
                    </div>
                </div>

                <div className="loading-section">
                    <div className="loader-loading-bar-container">
                        <div className="loader-loading-bar"></div>
                    </div>

                    <div className="loading-text">LOADING<span className="dots">{dots}</span></div>
                </div>
            </div>
        </div>
    );
};
