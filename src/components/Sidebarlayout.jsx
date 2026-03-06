import { useAuth } from '../AuthContext';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const SidebarLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const sidebarWidth = isMobile ? 0 : collapsed ? 64 : 240;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar onCollapse={setCollapsed} />
            <main style={{
                paddingLeft: sidebarWidth,
                paddingTop: isMobile ? 56 : 0,
                minHeight: '100vh',
                width: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden',
                transition: 'padding-left 0.25s ease',
            }}>
                {children}
            </main>
        </div>
    );
};

export default SidebarLayout;