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
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar onCollapse={setCollapsed} />
            <main style={{
                marginLeft: sidebarWidth,
                marginTop: isMobile ? 56 : 0,
                flex: 1,
                minWidth: 0,
                transition: 'margin-left 0.25s ease',
            }}>
                {children}
            </main>
        </div>
    );
};

export default SidebarLayout;