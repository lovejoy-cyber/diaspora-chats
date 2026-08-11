import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import Feed from "./Feed";
import Messages from "./Messages";
import Market from "./Market";
import Embassy from "./Embassy";
import Reels from "./Reels";
import Assistant from "./Assistant";
import People from "./People";
import Rooms from "./Rooms";
import Profile from "./Profile";
import Admin from "./Admin";
import Calls from "./Calls";
import ViewProfile from "./ViewProfile";
import NotificationBell from "../components/NotificationBell";
import GlobalSearch from "../components/GlobalSearch";
import IncomingCallListener from "../components/IncomingCallListener";
import { useTranslation } from "../lib/useTranslation";

const ROLE_LABELS = {
  admin: {label:"Super Admin", cls:"role-badge-admin"},
  embassy: {label:"Embassy Delegate", cls:"role-badge-embassy"},
  governor: {label:"Governor", cls:"role-badge-governor"},
  president: {label:"President", cls:"role-badge-embassy"},
  vice_president: {label:"Vice President", cls:"role-badge-embassy"},
  secretary: {label:"Secretary", cls:"role-badge-governor"},
  treasurer: {label:"Treasurer", cls:"role-badge-governor"},
  sender: {label:"Money Sender", cls:null},
  ambassador: {label:"Ambassador", cls:"role-badge-governor"},
  student: {label:"Student", cls:null},
};

const NAV = [
  {path:"",labelKey:"feed",icon:"🏠",end:true},
  {path:"messages",labelKey:"messages",icon:"💬"},
  {path:"rooms",labelKey:"rooms",icon:"🌍"},
  {path:"market",labelKey:"marketplace",icon:"🛍️"},
  {path:"embassy",labelKey:"embassy",icon:"🏛️"},
  {path:"reels",labelKey:"reels",icon:"🎬"},
  {path:"assistant",labelKey:"assistant",icon:"🤖"},
  {path:"calls",labelKey:"calls",icon:"📞"},
  {path:"people",labelKey:"people",icon:"👥"},
  {path:"profile",labelKey:"myProfile",icon:"👤"},
];

// Staff/admin status now comes from AuthContext's ROLE_LEVELS (single source of truth).

export default function Dashboard() {
  const { userProfile, isStaff, isAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("dl_theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dl_theme", theme);
  }, [theme]);
  const initial = userProfile?.fullName?.[0]?.toUpperCase() || "?";
  // isStaff now comes from AuthContext (single source of truth — see ROLE_LEVELS) instead
  // of a locally duplicated array that had drifted out of sync (was missing superadmin
  // and used "vice_president" with an underscore when the real role key has none).
  const roleInfo = ROLE_LABELS[userProfile?.role] || ROLE_LABELS.student;
  const logout = async () => { await signOut(auth); navigate("/login"); };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🌍</span>
          <div className="sidebar-logo-text">
            <h2>DiasporaLink</h2>
            <p>Safe · Verified · Connected</p>
          </div>
        </div>
        <div className="sidebar-user" onClick={()=>navigate("/dashboard/profile")}>
          {userProfile?.photoURL
            ? <img src={userProfile.photoURL} alt="avatar" className="sidebar-avatar" />
            : <div className="sidebar-avatar-ph">{initial}</div>}
          <div className="sidebar-user-info">
            <h4>{userProfile?.fullName||"Member"}{userProfile?.verified&&<span className="verified-badge">✓</span>}</h4>
            <span><span className="online-dot" />{roleInfo.label}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu</div>
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path===""?"/dashboard":"/dashboard/"+item.path} end={item.end||false} className={({isActive})=>"nav-item"+(isActive?" active":"")}>
              <span className="nav-icon">{item.icon}</span>{t(item.labelKey)}
            </NavLink>
          ))}
          {isStaff && (
            <>
              <div className="nav-section-title" style={{marginTop:16}}>Administration</div>
              <NavLink to="/dashboard/admin" className={({isActive})=>"nav-item"+(isActive?" active":"")}>
                <span className="nav-icon">🛡️</span>Admin Panel
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} className="btn-secondary" style={{ marginBottom: 8 }}>
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button onClick={logout} className="btn-secondary">🚪 Sign Out</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="main-header">
          <span className="main-header-title" style={{display:"none"}}>DiasporaLink</span>
          <GlobalSearch />
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <NotificationBell />
            <button
              onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-only-menu-btn"
              style={{display:"none",background:"none",border:"1px solid var(--border)",color:"var(--text2)",cursor:"pointer",fontSize:16,padding:"6px 10px",borderRadius:8}}
            >
              {userProfile?.photoURL
                ? <img src={userProfile.photoURL} alt="" style={{width:22,height:22,borderRadius:"50%",objectFit:"cover"}} />
                : "☰"}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200}} onClick={()=>setMobileMenuOpen(false)}>
            <div style={{position:"absolute",top:0,right:0,width:"78%",maxWidth:300,height:"100%",background:"var(--bg-card)",padding:"20px 16px",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,paddingBottom:16,borderBottom:"1px solid var(--border)"}}>
                {userProfile?.photoURL
                  ? <img src={userProfile.photoURL} alt="" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover"}} />
                  : <div className="sidebar-avatar-ph" style={{width:44,height:44,fontSize:16}}>{initial}</div>}
                <div>
                  <div style={{fontWeight:700,fontSize:14}}>{userProfile?.fullName}{userProfile?.verified&&<span className="verified-badge" style={{marginLeft:5}}>✓</span>}</div>
                  <div style={{fontSize:11,color:"var(--text2)"}}>{roleInfo.label}</div>
                </div>
              </div>
              <div onClick={()=>{navigate("/dashboard/profile");setMobileMenuOpen(false);}} style={{padding:"11px 8px",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>👤 My Profile</div>
              <div onClick={()=>{navigate("/dashboard/rooms");setMobileMenuOpen(false);}} style={{padding:"11px 8px",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>🌍 Rooms & Groups</div>
              <div onClick={()=>{navigate("/dashboard/embassy");setMobileMenuOpen(false);}} style={{padding:"11px 8px",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>🏛️ Embassy</div>
              <div onClick={()=>{navigate("/dashboard/assistant");setMobileMenuOpen(false);}} style={{padding:"11px 8px",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>🤖 Assistant</div>
              <div onClick={()=>{navigate("/dashboard/people");setMobileMenuOpen(false);}} style={{padding:"11px 8px",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>👥 People</div>
              {isStaff && (
                <div onClick={()=>{navigate("/dashboard/admin");setMobileMenuOpen(false);}} style={{padding:"11px 8px",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>🛡️ Admin Panel</div>
              )}
              <div onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{padding:"11px 8px",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>{theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}</div>
              <div style={{borderTop:"1px solid var(--border)",marginTop:10,paddingTop:10}}>
                <div onClick={logout} style={{padding:"11px 8px",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:10,color:"#fca5a5"}}>🚪 Sign Out</div>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Messages />} />
          <Route path="market" element={<Market />} />
          <Route path="embassy" element={<Embassy />} />
          <Route path="reels" element={<Reels />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="people" element={<People />} />
          <Route path="calls" element={<Calls />} />
          <Route path="profile" element={<Profile />} />
          <Route path="user/:uid" element={<ViewProfile />} />
          {isStaff && <Route path="admin" element={<Admin />} />}
        </Routes>

        <nav className="mobile-nav">
          <NavLink to="/dashboard" end className={({isActive})=>"mobile-nav-item"+(isActive?" active":"")}>
            <span className="mobile-nav-icon">🏠</span>Posts
          </NavLink>
          <NavLink to="/dashboard/messages" className={({isActive})=>"mobile-nav-item"+(isActive?" active":"")}>
            <span className="mobile-nav-icon">💬</span>Chat
          </NavLink>
          <NavLink to="/dashboard/reels" className={({isActive})=>"mobile-nav-item"+(isActive?" active":"")}>
            <span className="mobile-nav-icon">🎬</span>Reels
          </NavLink>
          <NavLink to="/dashboard/market" className={({isActive})=>"mobile-nav-item"+(isActive?" active":"")}>
            <span className="mobile-nav-icon">🛍️</span>Market
          </NavLink>
          <NavLink to="/dashboard/rooms" className={({isActive})=>"mobile-nav-item"+(isActive?" active":"")}>
            <span className="mobile-nav-icon">🌍</span>Rooms
          </NavLink>
          <NavLink to="/dashboard/calls" className={({isActive})=>"mobile-nav-item"+(isActive?" active":"")}>
            <span className="mobile-nav-icon">📞</span>Calls
          </NavLink>
        </nav>
      </main>
      <IncomingCallListener />
    </div>
  );
}
